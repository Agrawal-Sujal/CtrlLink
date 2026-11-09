package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.url.dto.TagSummaryDto;
import com.sunflower.ctrllink.url.dto.UrlStatsResponseDto;
import com.sunflower.ctrllink.url.entity.FolderWordEntity;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.FolderWordRepository;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.utils.Base62IdEncoder;
import com.sunflower.ctrllink.utils.EncryptionUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private FolderWordRepository folderWordRepository;

    @Mock
    private IdRangeService idRangeService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private HashOperations<String, Object, Object> hashOperations;

    @Mock
    private GlobalStatsRepository globalStatsRepository;

    @Mock
    private MetadataService metadataService;

    @Mock
    private EncryptionUtils encryptionUtils;

    @Mock
    private AnalyticsService analyticsService;

    private Base62IdEncoder base62IdEncoder;
    private FolderService folderService;
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        base62IdEncoder = new Base62IdEncoder();
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        folderService = new FolderService(folderWordRepository, stringRedisTemplate);

        urlService = new UrlService(
                urlRepository,
                base62IdEncoder,
                idRangeService,
                redisTemplate,
                globalStatsRepository,
                metadataService,
                encryptionUtils,
                analyticsService,
                folderService
        );
    }

    @Test
    void shouldShortenUrlUsingIdRangeService() {
        String longUrl = "https://example.com/very/long/url";
        when(urlRepository.findFirstByLongUrlAndUserIdIsNullAndIsCustomFalseAndExpiryTimeIsNullAndPasswordIsNull(longUrl))
                .thenReturn(Optional.empty());

        when(idRangeService.getNextId()).thenReturn(100L);
        when(urlRepository.existsByFolderPathKeyAndShortId("", "bM")).thenReturn(false);

        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, null, null, null, null, null, false, null);

        assertNotNull(result);
        assertEquals("bM", result.getShortId());
        assertEquals(longUrl, result.getLongUrl());
        assertEquals("", result.getFolderPathKey());
        assertEquals("bM", result.getCustomPath());
        assertFalse(result.isCustom());

        verify(idRangeService, times(1)).getNextId();
        verify(urlRepository, times(1)).save(any(UrlEntity.class));
    }

    @Test
    void shouldSkipCollidingAliasWhenGeneratingRandomUrl() {
        String longUrl = "https://example.com/collision-test";
        when(urlRepository.findFirstByLongUrlAndUserIdIsNullAndIsCustomFalseAndExpiryTimeIsNullAndPasswordIsNull(longUrl))
                .thenReturn(Optional.empty());

        when(idRangeService.getNextId()).thenReturn(100L, 101L);
        when(urlRepository.existsByFolderPathKeyAndShortId("", "bM")).thenReturn(true);  // Collision!
        when(urlRepository.existsByFolderPathKeyAndShortId("", "bN")).thenReturn(false); // Free!

        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, null, null, null, null, null, false, null);

        assertNotNull(result);
        assertEquals("bN", result.getShortId());
        verify(idRangeService, times(2)).getNextId();
        verify(urlRepository, times(1)).existsByFolderPathKeyAndShortId("", "bM");
        verify(urlRepository, times(1)).existsByFolderPathKeyAndShortId("", "bN");
    }

    @Test
    void shouldCreateNestedFolderUrlWithCustomAlias() {
        String longUrl = "https://youtube.com/watch?v=123";
        String customPath = "youtube/videos/programming";

        FolderWordEntity word1 = new FolderWordEntity("youtube");
        setId(word1, 1L);
        FolderWordEntity word2 = new FolderWordEntity("videos");
        setId(word2, 2L);

        when(folderWordRepository.findByWord("youtube")).thenReturn(Optional.of(word1));
        when(folderWordRepository.findByWord("videos")).thenReturn(Optional.of(word2));

        when(urlRepository.findByFolderPathKeyAndShortId("1_2", "programming")).thenReturn(Optional.empty());
        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, customPath, null, 1L, null, null, false, null);

        assertNotNull(result);
        assertEquals("programming", result.getShortId());
        assertEquals("1_2", result.getFolderPathKey());
        assertEquals("youtube/videos/programming", result.getCustomPath());
        assertTrue(result.isCustom());
        verify(globalStatsRepository, times(1)).incrementLinks();
    }

    @Test
    void shouldCreateNestedFolderUrlWithAutoGeneratedSlug() {
        String longUrl = "https://youtube.com/watch?v=123";
        String customPath = "youtube/videos/";

        FolderWordEntity word1 = new FolderWordEntity("youtube");
        setId(word1, 1L);
        FolderWordEntity word2 = new FolderWordEntity("videos");
        setId(word2, 2L);

        when(folderWordRepository.findByWord("youtube")).thenReturn(Optional.of(word1));
        when(folderWordRepository.findByWord("videos")).thenReturn(Optional.of(word2));

        when(idRangeService.getNextId()).thenReturn(200L);
        when(urlRepository.existsByFolderPathKeyAndShortId("1_2", "do")).thenReturn(false);
        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, customPath, null, 1L, null, null, false, null);

        assertNotNull(result);
        assertEquals("do", result.getShortId());
        assertEquals("1_2", result.getFolderPathKey());
        assertEquals("youtube/videos/do", result.getCustomPath());
    }

    @Test
    void shouldRejectPathExceedingMaxDepth() {
        String longUrl = "https://example.com";
        String deepPath = "one/two/three/four/five/six"; // 6 segments

        assertThrows(BadRequestException.class, () ->
                urlService.shortenUrl(longUrl, deepPath, null, 1L, null, null, false, null)
        );
    }

    @Test
    void shouldRejectInvalidSegmentCharacters() {
        String longUrl = "https://example.com";
        String invalidPath = "you tube/videos"; // space in segment

        assertThrows(BadRequestException.class, () ->
                urlService.shortenUrl(longUrl, invalidPath, null, 1L, null, null, false, null)
        );
    }

    @Test
    void shouldGetUserTagsWithCounts() {
        Long userId = 42L;
        List<Object[]> mockRows = List.of(
                new Object[]{"developer", 5L},
                new Object[]{"docs", 2L}
        );
        when(urlRepository.getTagCountsByUserId(userId)).thenReturn(mockRows);

        List<TagSummaryDto> tags = urlService.getUserTags(userId);

        assertEquals(2, tags.size());
        assertEquals("developer", tags.get(0).getTag());
        assertEquals(5L, tags.get(0).getCount());
        assertEquals("docs", tags.get(1).getTag());
        assertEquals(2L, tags.get(1).getCount());
    }

    @Test
    void shouldFilterMyLinksByTag() {
        Long userId = 42L;
        Pageable pageable = PageRequest.of(0, 10);
        UrlEntity entity = new UrlEntity();
        entity.setShortId("xyz12");
        entity.setCustomPath("xyz12");
        entity.setLongUrl("https://example.com");
        entity.setTags(Set.of("developer"));
        Page<UrlEntity> page = new PageImpl<>(List.of(entity), pageable, 1);

        when(urlRepository.findByUserIdAndTag(userId, "developer", pageable)).thenReturn(page);

        Page<UrlStatsResponseDto> result = urlService.getMyLinks(userId, null, "developer", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("xyz12", result.getContent().get(0).getShortId());
        assertTrue(result.getContent().get(0).getTags().contains("developer"));
    }

    @Test
    void shouldIncrementPlatformLinksWhenCustomAliasCreated() {
        String longUrl = "https://example.com/custom";
        String alias = "mybrand";
        when(urlRepository.findByFolderPathKeyAndShortId("", alias)).thenReturn(Optional.empty());
        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, alias, null, 1L, null, null, false, null);

        assertNotNull(result);
        assertEquals(alias, result.getShortId());
        verify(globalStatsRepository, times(1)).incrementLinks();
    }

    @Test
    void shouldDecrementPlatformLinksWhenUrlDeleted() {
        String shortId = "abc12";
        Long userId = 10L;
        UrlEntity entity = new UrlEntity();
        entity.setShortId(shortId);
        entity.setCustomPath(shortId);
        entity.setUserId(userId);
        when(urlRepository.findByCustomPathAndUserId(shortId, userId)).thenReturn(Optional.of(entity));

        urlService.deleteUrl(shortId, userId);

        verify(urlRepository, times(1)).delete(entity);
        verify(globalStatsRepository, times(1)).decrementLinks(1);
    }

    @Test
    void shouldDecrementPlatformLinksWhenUrlsBulkDeleted() {
        Long userId = 10L;
        UrlEntity entity1 = new UrlEntity();
        entity1.setShortId("url1");
        entity1.setCustomPath("url1");
        entity1.setUserId(userId);

        UrlEntity entity2 = new UrlEntity();
        entity2.setShortId("url2");
        entity2.setCustomPath("url2");
        entity2.setUserId(userId);

        when(urlRepository.findByCustomPathAndUserId("url1", userId)).thenReturn(Optional.of(entity1));
        when(urlRepository.findByCustomPathAndUserId("url2", userId)).thenReturn(Optional.of(entity2));

        urlService.deleteUrls(List.of("url1", "url2"), userId);

        verify(urlRepository, times(1)).delete(entity1);
        verify(urlRepository, times(1)).delete(entity2);
        verify(globalStatsRepository, times(1)).decrementLinks(2);
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
