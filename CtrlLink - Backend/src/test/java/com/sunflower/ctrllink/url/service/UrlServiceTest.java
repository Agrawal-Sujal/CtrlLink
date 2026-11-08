package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.utils.Base62IdEncoder;
import com.sunflower.ctrllink.utils.EncryptionUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
}
