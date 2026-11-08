package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.url.dto.TagSummaryDto;
import com.sunflower.ctrllink.url.dto.UrlStatsResponseDto;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Set;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.utils.Base62IdEncoder;
import com.sunflower.ctrllink.utils.EncryptionUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private IdRangeService idRangeService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

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
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        base62IdEncoder = new Base62IdEncoder();
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForHash()).thenReturn(hashOperations);

        urlService = new UrlService(
                urlRepository,
                base62IdEncoder,
                idRangeService,
                redisTemplate,
                globalStatsRepository,
                metadataService,
                encryptionUtils,
                analyticsService
        );
    }

    @Test
    void shouldShortenUrlUsingIdRangeService() {
        String longUrl = "https://example.com/very/long/url";
        when(urlRepository.findFirstByLongUrlAndUserIdIsNullAndIsCustomFalseAndExpiryTimeIsNullAndPasswordIsNull(longUrl))
                .thenReturn(Optional.empty());

        when(idRangeService.getNextId()).thenReturn(100L);
        when(urlRepository.existsByShortId("bM")).thenReturn(false); // Base62 of 100 is "bM"

        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, null, null, null, null, null, false, null);

        assertNotNull(result);
        assertEquals("bM", result.getShortId());
        assertEquals(longUrl, result.getLongUrl());
        assertFalse(result.isCustom());

        verify(idRangeService, times(1)).getNextId();
        verify(urlRepository, times(1)).save(any(UrlEntity.class));
    }

    @Test
    void shouldSkipCollidingAliasWhenGeneratingRandomUrl() {
        String longUrl = "https://example.com/collision-test";
        when(urlRepository.findFirstByLongUrlAndUserIdIsNullAndIsCustomFalseAndExpiryTimeIsNullAndPasswordIsNull(longUrl))
                .thenReturn(Optional.empty());

        // First ID produces "bM" which collides with an existing custom alias
        // Second ID produces "bN" which is free
        when(idRangeService.getNextId()).thenReturn(100L, 101L);
        when(urlRepository.existsByShortId("bM")).thenReturn(true);  // Collision!
        when(urlRepository.existsByShortId("bN")).thenReturn(false); // Free!

        when(urlRepository.save(any(UrlEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlEntity result = urlService.shortenUrl(longUrl, null, null, null, null, null, false, null);

        assertNotNull(result);
        assertEquals("bN", result.getShortId());
        // Verify it requested a second ID from the in-memory buffer
        verify(idRangeService, times(2)).getNextId();
        verify(urlRepository, times(1)).existsByShortId("bM");
        verify(urlRepository, times(1)).existsByShortId("bN");
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
}
