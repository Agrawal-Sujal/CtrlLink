package com.sunflower.ctrllink.url.controller;

import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.exception.GoneException;
import com.sunflower.ctrllink.exception.NotFoundException;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.url.service.FolderService;
import com.sunflower.ctrllink.url.service.UrlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@Tag(name = "Redirect & Previews", description = "Endpoints for handling short URL redirects and social media rich previews (OG tags)")
public class RedirectController {

    private static final Logger log = LoggerFactory.getLogger(RedirectController.class);
    private final UrlService urlService;
    private final UrlRepository urlRepository;
    private final AnalyticsService analyticsService;
    private final RedisTemplate<String, String> redisTemplate;
    private final FolderService folderService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public RedirectController(UrlService urlService, UrlRepository urlRepository,
                              AnalyticsService analyticsService,
                              RedisTemplate<String, String> redisTemplate,
                              FolderService folderService) {
        this.urlService = urlService;
        this.urlRepository = urlRepository;
        this.analyticsService = analyticsService;
        this.redisTemplate = redisTemplate;
        this.folderService = folderService;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String cleanPath(String rawPath) {
        if (rawPath == null) return "";
        String clean = rawPath.trim();
        while (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        while (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        return clean;
    }

    @Operation(summary = "Redirect or Social Preview", description = "Handles the core redirection logic for root and nested custom folder paths. Detects social media bots and returns OG tags for rich previews. Otherwise, redirects to the target URL (or password challenge).")
    @GetMapping("/{*path}")
    public ResponseEntity<?> redirect(@PathVariable String path, HttpServletRequest request) {

        String targetPath = cleanPath(path);
        if (targetPath.isEmpty()) {
            throw new NotFoundException("URL not found");
        }

        // Avoid intercepting internal endpoints if path pattern falls through
        String lowerTargetPath = targetPath.toLowerCase();
        if (lowerTargetPath.startsWith("api/") || lowerTargetPath.startsWith("swagger-ui") ||
            lowerTargetPath.startsWith("v3/") || lowerTargetPath.startsWith("actuator") ||
            lowerTargetPath.equals("favicon.ico")) {
            throw new NotFoundException("Endpoint not found");
        }

        log.debug("Redirect requested for path='{}' [ip={}]", targetPath, getClientIp(request));

        String[] segments = targetPath.split("/");
        if (segments.length > 5) {
            throw new NotFoundException("URL not found");
        }

        String terminalAlias = segments[segments.length - 1];
        List<String> folderSegments = (segments.length > 1)
                ? Arrays.stream(Arrays.copyOfRange(segments, 0, segments.length - 1))
                        .map(s -> s.trim().toLowerCase())
                        .toList()
                : Collections.emptyList();

        // Canonical path: lowercase folder segments + exact case terminal slug
        String canonicalPath = folderSegments.isEmpty()
                ? terminalAlias
                : String.join("/", folderSegments) + "/" + terminalAlias;

        String cacheKey = "url:entity:path:" + canonicalPath;
        Map<Object, Object> cached = redisTemplate.opsForHash().entries(cacheKey);
        if (cached.isEmpty() && !canonicalPath.contains("/")) {
            // Also check legacy root cache key
            cached = redisTemplate.opsForHash().entries("url:entity:" + canonicalPath);
        }
        // Fallback for custom aliases created in lowercase but accessed with mixed casing
        if (cached.isEmpty() && !terminalAlias.equals(terminalAlias.toLowerCase())) {
            String lowerPath = canonicalPath.toLowerCase();
            cached = redisTemplate.opsForHash().entries("url:entity:path:" + lowerPath);
            if (cached.isEmpty() && !lowerPath.contains("/")) {
                cached = redisTemplate.opsForHash().entries("url:entity:" + lowerPath);
            }
        }

        String longUrl;
        boolean hasPassword;
        String title;
        String fullPath = canonicalPath;

        if (!cached.isEmpty()) {
            // Cache HIT — zero DB hit on hot path
            log.trace("Redirect cache HIT for path='{}'", canonicalPath);
            longUrl     = (String) cached.get("longUrl");
            hasPassword = "true".equals(cached.get("hasPassword"));
            title       = (String) cached.get("title");
            if (cached.containsKey("customPath")) {
                fullPath = (String) cached.get("customPath");
            }

            // Check expiry from cache
            String expiryStr = (String) cached.get("expiryTime");
            if (expiryStr != null && !expiryStr.isEmpty()
                    && LocalDateTime.parse(expiryStr).isBefore(LocalDateTime.now())) {
                log.info("Redirect rejected: path='{}' has expired", canonicalPath);
                throw new GoneException("Short URL has expired");
            }
        } else {
            // Cache MISS — parse folder hierarchy and query database
            log.debug("Redirect cache MISS for path='{}', querying database", canonicalPath);

            String folderPathKey = "";
            if (!folderSegments.isEmpty()) {
                Optional<String> resolvedKeyOpt = folderService.resolveFolderPathKey(folderSegments);
                if (resolvedKeyOpt.isEmpty()) {
                    log.debug("Folder path does not exist for: '{}'", canonicalPath);
                    throw new NotFoundException("URL not found");
                }
                folderPathKey = resolvedKeyOpt.get();
            }

            final String fKey = folderPathKey;
            UrlEntity entity = urlRepository.findByFolderPathKeyAndShortId(fKey, terminalAlias)
                    .or(() -> !terminalAlias.equals(terminalAlias.toLowerCase())
                            ? urlRepository.findByFolderPathKeyAndShortId(fKey, terminalAlias.toLowerCase())
                            : Optional.empty())
                    .or(() -> urlRepository.findByCustomPath(canonicalPath))
                    .or(() -> !canonicalPath.equals(canonicalPath.toLowerCase())
                            ? urlRepository.findByCustomPath(canonicalPath.toLowerCase())
                            : Optional.empty())
                    .or(() -> (!canonicalPath.contains("/")) ? urlRepository.findByShortId(terminalAlias) : Optional.empty())
                    .or(() -> (!canonicalPath.contains("/") && !terminalAlias.equals(terminalAlias.toLowerCase()))
                            ? urlRepository.findByShortId(terminalAlias.toLowerCase()) : Optional.empty())
                    .orElseThrow(() -> new NotFoundException("URL not found"));

            if (entity.getExpiryTime() != null && entity.getExpiryTime().isBefore(LocalDateTime.now())) {
                log.info("Redirect rejected: path='{}' has expired (from DB check)", canonicalPath);
                throw new GoneException("Short URL has expired");
            }

            longUrl     = entity.getLongUrl();
            hasPassword = entity.getPassword() != null;
            title       = entity.getTitle();
            fullPath    = entity.getCustomPath() != null ? entity.getCustomPath() : canonicalPath;

            cacheEntityForRedirect(cacheKey, entity);
            if (entity.getCustomPath() != null && !entity.getCustomPath().equals(canonicalPath)) {
                cacheEntityForRedirect("url:entity:path:" + entity.getCustomPath(), entity);
            }
            if (!canonicalPath.contains("/")) {
                cacheEntityForRedirect("url:entity:" + canonicalPath, entity);
            }
        }

        // Social Bot Detection for Rich Previews
        String userAgent = request.getHeader("User-Agent");
        if (isSocialBot(userAgent)) {
            log.info("Social bot detected for path='{}': ua={}", fullPath, userAgent);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body(generateSocialHtml(title, longUrl, fullPath, request));
        }

        // If password is set, redirect to frontend password challenge page
        if (hasPassword) {
            log.debug("Redirect intercepted: password required for path='{}'", fullPath);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/p/" + fullPath))
                    .build();
        }

        // Record Analytics
        analyticsService.recordClick(fullPath, getClientIp(request), request.getHeader("User-Agent"), request.getHeader("Referer"));

        log.info("Redirecting path='{}' -> target={}", fullPath, longUrl);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(longUrl))
                .build();
    }

    private void cacheEntityForRedirect(String cacheKey, UrlEntity entity) {
        Map<String, String> fields = new HashMap<>();
        fields.put("longUrl", entity.getLongUrl());
        fields.put("hasPassword", String.valueOf(entity.getPassword() != null));
        fields.put("title", entity.getTitle() != null ? entity.getTitle() : "");
        fields.put("customPath", entity.getCustomPath() != null ? entity.getCustomPath() : entity.getShortId());
        fields.put("expiryTime", entity.getExpiryTime() != null ? entity.getExpiryTime().toString() : "");

        redisTemplate.opsForHash().putAll(cacheKey, fields);
        redisTemplate.expire(cacheKey, 24, TimeUnit.HOURS);
    }

    private boolean isSocialBot(String ua) {
        if (ua == null) return false;
        String lowerUa = ua.toLowerCase();
        return lowerUa.contains("whatsapp") ||
               lowerUa.contains("facebookexternalhit") ||
               lowerUa.contains("twitterbot") ||
               lowerUa.contains("slackbot") ||
               lowerUa.contains("linkedinbot") ||
               lowerUa.contains("discordbot") ||
               lowerUa.contains("telegrambot");
    }

    private String generateSocialHtml(String title, String longUrl, String fullPath, HttpServletRequest request) {
        String displayTitle = (title != null && !title.isBlank()) ? title : "CtrlLink | Smart URL Shortener & Digital Identity";
        String description = "AI-secured short link by CtrlLink — smart URL shortener with analytics and Bio-Link profiles.";

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        String url = scheme + "://" + serverName + "/" + fullPath;

        String imageUrl = "";

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>" + displayTitle + "</title>\n" +
                "    <meta name=\"description\" content=\"" + description + "\">\n" +
                "    <meta property=\"og:title\" content=\"" + displayTitle + "\">\n" +
                "    <meta property=\"og:description\" content=\"" + description + "\">\n" +
                "    <meta property=\"og:image\" content=\"" + imageUrl + "\">\n" +
                "    <meta property=\"og:url\" content=\"" + url + "\">\n" +
                "    <meta property=\"og:type\" content=\"website\">\n" +
                "    <meta name=\"twitter:card\" content=\"summary_large_image\">\n" +
                "    <meta name=\"twitter:title\" content=\"" + displayTitle + "\">\n" +
                "    <meta name=\"twitter:description\" content=\"" + description + "\">\n" +
                "    <meta name=\"twitter:image\" content=\"" + imageUrl + "\">\n" +
                "    <meta http-equiv=\"refresh\" content=\"0;url=" + longUrl + "\">\n" +
                "</head>\n" +
                "<body>\n" +
                "    <p>Redirecting to <a href=\"" + longUrl + "\">" + longUrl + "</a>...</p>\n" +
                "</body>\n" +
                "</html>";
    }
}
