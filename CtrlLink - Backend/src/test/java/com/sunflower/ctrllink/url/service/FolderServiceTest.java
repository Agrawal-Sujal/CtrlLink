package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.url.dto.ParsedPath;
import com.sunflower.ctrllink.url.entity.FolderWordEntity;
import com.sunflower.ctrllink.url.repository.FolderWordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FolderServiceTest {

    @Mock
    private FolderWordRepository folderWordRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private FolderService folderService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        folderService = new FolderService(folderWordRepository, redisTemplate);
    }

    @Test
    void shouldParseNestedPathCorrectly() {
        ParsedPath parsed = folderService.parsePath("/youtube/videos/programming");
        assertEquals(List.of("youtube", "videos"), parsed.folderSegments());
        assertEquals("programming", parsed.terminalAlias());
        assertFalse(parsed.requiresAutoSlug());
        assertEquals("youtube/videos/programming", parsed.originalCleanPath());
    }

    @Test
    void shouldParseFolderWithTrailingSlashAsRequiringAutoSlug() {
        ParsedPath parsed = folderService.parsePath("youtube/videos/");
        assertEquals(List.of("youtube", "videos"), parsed.folderSegments());
        assertNull(parsed.terminalAlias());
        assertTrue(parsed.requiresAutoSlug());
        assertEquals("youtube/videos", parsed.originalCleanPath());
    }

    @Test
    void shouldParseSingleCustomAliasAsRoot() {
        ParsedPath parsed = folderService.parsePath("summer-sale");
        assertTrue(parsed.isRoot());
        assertEquals("summer-sale", parsed.terminalAlias());
        assertFalse(parsed.requiresAutoSlug());
    }

    @Test
    void shouldEnforceMaxDepthOfFiveSegments() {
        assertThrows(BadRequestException.class, () ->
                folderService.parsePath("a/b/c/d/e/f") // 6 segments
        );
    }

    @Test
    void shouldEnforceMaxDepthWithTrailingSlash() {
        assertThrows(BadRequestException.class, () ->
                folderService.parsePath("a/b/c/d/e/") // 5 folders + 1 slug = 6 segments
        );
    }

    @Test
    void shouldRejectConsecutiveSlashes() {
        assertThrows(BadRequestException.class, () ->
                folderService.parsePath("youtube//videos")
        );
    }

    @Test
    void shouldCombineKeysWithUnderscore() {
        FolderWordEntity word1 = new FolderWordEntity("youtube");
        setId(word1, 1L);
        FolderWordEntity word2 = new FolderWordEntity("videos");
        setId(word2, 2L);

        when(folderWordRepository.findByWord("youtube")).thenReturn(Optional.of(word1));
        when(folderWordRepository.findByWord("videos")).thenReturn(Optional.of(word2));

        String folderKey = folderService.getOrCreateFolderPathKey(List.of("youtube", "videos"));
        assertEquals("1_2", folderKey);
    }

    @Test
    void shouldReturnEmptyOptionalWhenWordDoesNotExistOnRedirectResolution() {
        when(folderWordRepository.findByWord("youtube")).thenReturn(Optional.empty());

        Optional<String> resolved = folderService.resolveFolderPathKey(List.of("youtube", "videos"));
        assertTrue(resolved.isEmpty(), "Should fast-fail when folder word does not exist in DB");
    }

    private void setId(FolderWordEntity entity, Long id) {
        try {
            var field = FolderWordEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
