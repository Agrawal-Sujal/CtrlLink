package com.sunflower.ctrllink.url.controller;

import com.sunflower.ctrllink.analytics.PlatformStatsInitializer;
import com.sunflower.ctrllink.analytics.entity.GlobalStatsEntity;
import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.exception.ForbiddenException;
import com.sunflower.ctrllink.exception.NotFoundException;
import com.sunflower.ctrllink.rate.RateLimiterService;
import com.sunflower.ctrllink.url.dto.ReorderRequestDto;
import com.sunflower.ctrllink.url.dto.ShortenRequestDto;
import com.sunflower.ctrllink.url.dto.ShortenResponseDto;
import com.sunflower.ctrllink.url.dto.TagSummaryDto;
import com.sunflower.ctrllink.url.dto.UrlStatsResponseDto;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.url.service.UrlService;
import com.sunflower.ctrllink.user.entity.UserEntity;
import com.sunflower.ctrllink.user.repository.UserRepository;
import com.sunflower.ctrllink.utils.EncryptionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.apache.juli.logging.Log;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/url")
@Tag(name = "URL Management", description = "Endpoints for creating, managing, and tracking shortened links")
public class UrlController {

    private static final Logger log = LoggerFactory.getLogger(UrlController.class);
    private final UrlService urlService;
    private final UrlRepository urlRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GlobalStatsRepository globalStatsRepository;
    private final EncryptionUtils encryptionUtils;
    private final AnalyticsService analyticsService;
    private final RateLimiterService rateLimiterService;
    private final PlatformStatsInitializer platformStatsInitializer;

    @Value("${app.base-url}")
    private String baseUrl;

    public UrlController(UrlService urlService,
                         UrlRepository urlRepository, UserRepository userRepository,
                         PasswordEncoder passwordEncoder,
                         GlobalStatsRepository globalStatsRepository,
                         EncryptionUtils encryptionUtils,
                         AnalyticsService analyticsService,
                         RateLimiterService rateLimiterService,
                         PlatformStatsInitializer platformStatsInitializer) {
        this.urlService = urlService;
        this.urlRepository = urlRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.globalStatsRepository = globalStatsRepository;
        this.encryptionUtils = encryptionUtils;
        this.analyticsService = analyticsService;
        this.rateLimiterService = rateLimiterService;
        this.platformStatsInitializer = platformStatsInitializer;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Number n) {
            return n.longValue();
        }
        return null;
    }

    private Long getUserIdFromPrincipal(Object principal) {
        if (principal instanceof Long) return (Long) principal;
        if (principal instanceof Integer) return ((Integer) principal).longValue();
        return null;
    }

    @Operation(summary = "Create a short URL", description = "Generates a unique short ID for a long URL. Supports custom aliases and password protection.")
    @PostMapping("/shorten")
    public ShortenResponseDto shorten(@Valid @RequestBody ShortenRequestDto request, HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        Long userId = getCurrentUserId();
        log.info("Shorten request: longUrl={}, customAlias={}, userId={}, ip={}",
                request.getLongUrl(), request.getCustomAlias(), userId, ip);

        rateLimiterService.checkLimit("rate:shorten:" + ip, 10, 60);

        if (userId != null) {
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user != null && !user.isEmailVerified() && !"GOOGLE".equals(user.getAuthProvider())) {
                log.warn("Unverified user id={} attempted to shorten link", userId);
                throw new ForbiddenException("You must verify your email address before you can create links.");
            }
        }

        UrlEntity entity = urlService.shortenUrl(request.getLongUrl(), request.getCustomAlias(), request.getExpiryDays(), userId, request.getTitle(), request.getPassword(), request.isUseAutoTitle(), request.getTags());
        log.info("URL shortened successfully: shortId={}, customPath={}, longUrl={}",
                entity.getShortId(), entity.getCustomPath(), entity.getLongUrl());
        String displayPath = entity.getCustomPath() != null ? entity.getCustomPath() : entity.getShortId();
        return new ShortenResponseDto(
                entity.getShortId(),
                displayPath,
                entity.getFolderPathKey(),
                baseUrl + "/" + displayPath,
                entity.getLongUrl(),
                entity.getCreatedAt(),
                entity.getTitle(),
                entity.getPassword() != null,
                entity.getPassword() != null ? encryptionUtils.decrypt(entity.getPassword()) : null,
                entity.getCategory(),
                entity.getTags()
        );
    }

    @Operation(summary = "Get user's links", description = "Returns a paginated list of links created by the authenticated user.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/my-links")
    public Page<UrlStatsResponseDto> getMyLinks(
            @AuthenticationPrincipal Object principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = getUserIdFromPrincipal(principal);
        log.debug("Fetching user links: userId={} [search={}, tag={}, page={}]", userId, search, tag, pageable.getPageNumber());
        return urlService.getMyLinks(userId, search, tag, pageable);
    }

    @Operation(summary = "Get user's tags", description = "Returns a list of distinct tags with link counts for the authenticated user.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/tags")
    public List<TagSummaryDto> getUserTags(@AuthenticationPrincipal Object principal) {
        Long userId = getUserIdFromPrincipal(principal);
        log.debug("Fetching user tags for userId={}", userId);
        return urlService.getUserTags(userId);
    }

    @Operation(summary = "Reorder links", description = "Updates the sequence of links for the authenticated user.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderLinks(
            @AuthenticationPrincipal Object principal,
            @RequestBody ReorderRequestDto request) {
        Long userId = getUserIdFromPrincipal(principal);
        log.info("Reordering {} links for userId={}", request.getShortIds().size(), userId);
        urlService.reorderLinks(userId, request.getShortIds());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get link stats", description = "Returns click analytics and metadata for a specific short ID. Supports time ranges: '24h', '7d', and 'all'.")
    @GetMapping("/stats/{shortId}")
    public UrlStatsResponseDto getStats(
            @PathVariable String shortId,
            @RequestParam(defaultValue = "all") String range) {
        
        long lookbackMs = switch (range) {
            case "24h" -> 86400000L;
            case "7d" -> 604800000L;
            case "30d" -> 2592000000L;
            default -> 0L; // All time
        };
        log.debug("Stats query for shortId={} [range={}]", shortId, range);
        return urlService.getStats(shortId, lookbackMs);
    }

    @Operation(summary = "Delete a short URL", description = "Permanently removes a short link from the system.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @DeleteMapping("/{shortId}")
    public ResponseEntity<?> deleteUrl(@PathVariable String shortId, @AuthenticationPrincipal Long userId) {
        log.info("Deleting URL shortId={} by userId={}", shortId, userId);
        urlService.deleteUrl(shortId, userId);
        return ResponseEntity.ok(Map.of("message", "URL deleted successfully"));
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "Bulk delete short URLs", security = @SecurityRequirement(name = "Bearer Authentication"))
    public ResponseEntity<?> bulkDelete(@RequestBody List<String> shortIds, @AuthenticationPrincipal Long userId) {
        if (shortIds == null || shortIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No IDs provided"));
        }
        log.info("Bulk deleting {} URLs by userId={}", shortIds.size(), userId);
        urlService.deleteUrls(shortIds, userId);
        return ResponseEntity.ok(Map.of("message", "URLs deleted successfully", "count", shortIds.size()));
    }

    @Operation(summary = "Update link metadata", description = "Allows editing the title and password of an existing link.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PatchMapping("/{shortId}/metadata")
    public void updateMetadata(@PathVariable String shortId, @RequestBody Map<String, String> request) {
        Long userId = getCurrentUserId();
        if (userId == null) throw new BadRequestException("Authentication required");
        
        String title = request.get("title");
        String password = request.get("password");
        log.info("Updating link metadata for shortId={} by userId={}", shortId, userId);
        urlService.updateUrlMetadata(shortId, userId, title, password);
    }

    @Operation(summary = "Update link tags", description = "Allows editing the tags of an existing link.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PatchMapping("/{shortId}/tags")
    public void updateTags(@PathVariable String shortId, @RequestBody Map<String, java.util.Set<String>> request) {
        Long userId = getCurrentUserId();
        if (userId == null) throw new BadRequestException("Authentication required");
        
        java.util.Set<String> tags = request.get("tags");
        log.info("Updating tags for shortId={} by userId={}: tags={}", shortId, userId, tags);
        urlService.updateTags(shortId, userId, tags);
    }

    @Operation(summary = "Get public system stats", description = "Returns total links, users, and clicks for landing pages.")
    @GetMapping("/stats/public")
    public ResponseEntity<PublicStatsResponse> getPublicStats() {
        GlobalStatsEntity stats = globalStatsRepository.findById(1L)
                .orElseGet(platformStatsInitializer::initializeOrReconcileStats);
        return ResponseEntity.ok(new PublicStatsResponse(
                stats.getTotalLinks(),
                stats.getTotalUsers(),
                stats.getTotalClicks()));
    }

    @Operation(summary = "Resolve password-protected link", description = "Verifies password and returns the original long URL.")
    @PostMapping("/resolve/{*shortId}")
    public ResponseEntity<?> resolvePassword(@PathVariable String shortId, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String tempId = shortId != null ? shortId.trim() : "";
        while (tempId.startsWith("/")) {
            tempId = tempId.substring(1);
        }
        final String cleanId = tempId;
        String password = body.get("password");
        log.debug("Password verification attempt for shortId={}", cleanId);
        UrlEntity entity = urlRepository.findByCustomPath(cleanId)
                .or(() -> urlRepository.findByShortId(cleanId))
                .orElseThrow(() -> new NotFoundException("URL not found"));

        String storedPassword = entity.getPassword();
        boolean matches = false;
        
        if (storedPassword == null) {
            matches = true;
        } else {
            // AES-encrypted password — decrypt and compare
             matches = checkPassword(password, storedPassword);
        }

        if (matches) {
            // NEW: Record Analytics with IP
            String recordKey = entity.getCustomPath() != null ? entity.getCustomPath() : cleanId;
            analyticsService.recordClick(recordKey, getClientIp(request), request.getHeader("User-Agent"), request.getHeader("Referer"));
            return ResponseEntity.ok(Map.of("longUrl", entity.getLongUrl()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect password");
        }
    }

    private boolean checkPassword(String plain, String stored) {
        try {
            // Try BCrypt first (legacy)
            if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
                return passwordEncoder.matches(plain, stored);
            }
            // Use injected AES encryption (new)
            return plain.equals(encryptionUtils.decrypt(stored));
        } catch (Exception e) {
            return false;
        }
    }

    @Operation(summary = "Reveal link password", description = "Returns the decrypted password for a link owned by the authenticated user.", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/{shortId}/reveal-password")
    public ResponseEntity<?> revealPassword(@PathVariable String shortId) {
        Long userId = getCurrentUserId();
        if (userId == null) throw new BadRequestException("Authentication required");

        UrlEntity entity = urlRepository.findByShortIdAndUserId(shortId, userId)
                .orElseThrow(() -> new NotFoundException("URL not found or not owned by you"));

        if (entity.getPassword() == null) {
            return ResponseEntity.ok(Map.of("password", ""));
        }

        String decrypted = encryptionUtils.decrypt(entity.getPassword());
        return ResponseEntity.ok(Map.of("password", decrypted));
    }

    public static class PublicStatsResponse {
        public long totalLinks;
        public long totalUsers;
        public long totalClicks;

        public PublicStatsResponse(long totalLinks, long totalUsers, long totalClicks) {
            this.totalLinks = totalLinks;
            this.totalUsers = totalUsers;
            this.totalClicks = totalClicks;
        }
    }
}
