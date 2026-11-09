package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.url.dto.ParsedPath;
import com.sunflower.ctrllink.url.entity.FolderWordEntity;
import com.sunflower.ctrllink.url.repository.FolderWordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class FolderService {

    private static final Logger log = LoggerFactory.getLogger(FolderService.class);
    private static final Pattern SEGMENT_PATTERN = Pattern.compile("^[a-z0-9]([a-z0-9-]*[a-z0-9])?$");
    private static final int MAX_TOTAL_SEGMENTS = 5;
    private static final String FOLDER_CACHE_PREFIX = "folder:word:";

    private final FolderWordRepository folderWordRepository;
    private final StringRedisTemplate redisTemplate;

    // Fast in-memory L1 cache to avoid roundtrips for frequent words
    private final Map<String, Long> localWordCache = new ConcurrentHashMap<>();

    public FolderService(FolderWordRepository folderWordRepository, StringRedisTemplate redisTemplate) {
        this.folderWordRepository = folderWordRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Parses and validates a raw custom path input.
     * Enforces the <= 5 total segment limit and valid character patterns.
     */
    public ParsedPath parsePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return new ParsedPath(Collections.emptyList(), null, true, "");
        }

        String trimmed = rawPath.trim().toLowerCase();
        boolean endsWithSlash = trimmed.endsWith("/");

        // Strip leading and trailing slashes
        while (trimmed.startsWith("/")) {
            trimmed = trimmed.substring(1);
        }
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }

        if (trimmed.isEmpty()) {
            return new ParsedPath(Collections.emptyList(), null, true, "");
        }

        // Check for double slashes
        if (trimmed.contains("//")) {
            throw new BadRequestException("Path cannot contain empty segments or consecutive slashes");
        }

        String[] parts = trimmed.split("/");

        if (endsWithSlash) {
            // e.g. "youtube/videos/" -> 2 folder segments, terminal alias needs to be auto-generated
            // Total segments will be folder segments + 1 auto-slug
            if (parts.length >= MAX_TOTAL_SEGMENTS) {
                throw new BadRequestException("Path depth cannot exceed " + MAX_TOTAL_SEGMENTS + " segments");
            }
            List<String> folderSegments = new ArrayList<>();
            for (String part : parts) {
                validateSegment(part);
                folderSegments.add(part);
            }
            return new ParsedPath(folderSegments, null, true, trimmed);
        } else {
            // e.g. "youtube/videos/programming" -> 3 parts
            // or single word "myalias" -> 1 part
            if (parts.length > MAX_TOTAL_SEGMENTS) {
                throw new BadRequestException("Path depth cannot exceed " + MAX_TOTAL_SEGMENTS + " segments");
            }

            if (parts.length == 1) {
                // Root custom alias
                validateSegment(parts[0]);
                return new ParsedPath(Collections.emptyList(), parts[0], false, parts[0]);
            } else {
                List<String> folderSegments = new ArrayList<>();
                for (int i = 0; i < parts.length - 1; i++) {
                    validateSegment(parts[i]);
                    folderSegments.add(parts[i]);
                }
                String terminalAlias = parts[parts.length - 1];
                validateSegment(terminalAlias);
                return new ParsedPath(folderSegments, terminalAlias, false, trimmed);
            }
        }
    }

    private void validateSegment(String segment) {
        if (segment == null || segment.isBlank()) {
            throw new BadRequestException("Path segments cannot be blank");
        }
        if (segment.length() > 50) {
            throw new BadRequestException("Path segment '" + segment + "' exceeds 50 characters");
        }
        if (!SEGMENT_PATTERN.matcher(segment).matches()) {
            throw new BadRequestException("Segment '" + segment + "' is invalid. " +
                    "Segments must contain lowercase letters, numbers, or hyphens, and cannot start or end with a hyphen.");
        }
    }

    /**
     * Resolves or generates integer keys for each folder segment and joins them with underscore.
     * e.g. ["youtube", "videos"] -> "1_2".
     * Reuses existing keys or creates new entries in folder_words.
     */
    @Transactional
    public String getOrCreateFolderPathKey(List<String> folderSegments) {
        if (folderSegments == null || folderSegments.isEmpty()) {
            return "";
        }

        List<String> keys = new ArrayList<>();
        for (String segment : folderSegments) {
            Long wordId = getOrCreateWordId(segment);
            keys.add(String.valueOf(wordId));
        }

        return String.join("_", keys);
    }

    /**
     * Resolves the folder path key for an existing path.
     * If ANY folder word in the path does NOT exist in the database, returns Optional.empty()
     * (fast 404 path without needing to query the main urls table).
     */
    @Transactional(readOnly = true)
    public Optional<String> resolveFolderPathKey(List<String> folderSegments) {
        if (folderSegments == null || folderSegments.isEmpty()) {
            return Optional.of("");
        }

        List<String> keys = new ArrayList<>();
        for (String segment : folderSegments) {
            Optional<Long> wordIdOpt = findWordId(segment);
            if (wordIdOpt.isEmpty()) {
                return Optional.empty(); // Segment was never registered -> path cannot exist
            }
            keys.add(String.valueOf(wordIdOpt.get()));
        }

        return Optional.of(String.join("_", keys));
    }

    private Long getOrCreateWordId(String word) {
        // 1. Check local cache
        Long cachedLocal = localWordCache.get(word);
        if (cachedLocal != null) {
            return cachedLocal;
        }

        // 2. Check Redis cache
        String redisKey = FOLDER_CACHE_PREFIX + word;
        String cachedRedis = redisTemplate.opsForValue().get(redisKey);
        if (cachedRedis != null) {
            try {
                Long id = Long.parseLong(cachedRedis);
                localWordCache.put(word, id);
                return id;
            } catch (NumberFormatException ignored) {}
        }

        // 3. Check DB
        Optional<FolderWordEntity> existing = folderWordRepository.findByWord(word);
        if (existing.isPresent()) {
            Long id = existing.get().getId();
            cacheWordId(word, id);
            return id;
        }

        // 4. Create new word
        try {
            FolderWordEntity entity = new FolderWordEntity(word);
            FolderWordEntity saved = folderWordRepository.saveAndFlush(entity);
            Long id = saved.getId();
            cacheWordId(word, id);
            log.info("Registered new folder word: '{}' with key={}", word, id);
            return id;
        } catch (DataIntegrityViolationException e) {
            // Concurrent insert race condition: fetch the concurrently inserted row
            return folderWordRepository.findByWord(word)
                    .map(FolderWordEntity::getId)
                    .orElseThrow(() -> e);
        }
    }

    private Optional<Long> findWordId(String word) {
        Long cachedLocal = localWordCache.get(word);
        if (cachedLocal != null) {
            return Optional.of(cachedLocal);
        }

        String cachedRedis = redisTemplate.opsForValue().get(FOLDER_CACHE_PREFIX + word);
        if (cachedRedis != null) {
            try {
                Long id = Long.parseLong(cachedRedis);
                localWordCache.put(word, id);
                return Optional.of(id);
            } catch (NumberFormatException ignored) {}
        }

        Optional<FolderWordEntity> entityOpt = folderWordRepository.findByWord(word);
        if (entityOpt.isPresent()) {
            Long id = entityOpt.get().getId();
            cacheWordId(word, id);
            return Optional.of(id);
        }

        return Optional.empty();
    }

    private void cacheWordId(String word, Long id) {
        localWordCache.put(word, id);
        try {
            redisTemplate.opsForValue().set(FOLDER_CACHE_PREFIX + word, String.valueOf(id), 7, TimeUnit.DAYS);
        } catch (Exception e) {
            log.warn("Failed to cache folder word '{}' in Redis: {}", word, e.getMessage());
        }
    }
}
