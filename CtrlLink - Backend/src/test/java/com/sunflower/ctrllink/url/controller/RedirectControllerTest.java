package com.sunflower.ctrllink.url.controller;

import com.sunflower.ctrllink.analytics.service.AnalyticsService;
import com.sunflower.ctrllink.exception.NotFoundException;
import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.url.service.FolderService;
import com.sunflower.ctrllink.url.service.UrlService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedirectControllerTest {

    @Mock
    private UrlService urlService;

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private HashOperations<String, Object, Object> hashOperations;

    @Mock
    private FolderService folderService;

    @Mock
    private HttpServletRequest request;

    private RedirectController redirectController;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        redirectController = new RedirectController(
                urlService, urlRepository, analyticsService, redisTemplate, folderService
        );
    }

    @Test
    void shouldRedirectNestedFolderWithCaseSensitiveBase62Slug() {
        String path = "/youtube/Id";
        when(hashOperations.entries("url:entity:path:youtube/Id")).thenReturn(Collections.emptyMap());
        when(folderService.resolveFolderPathKey(List.of("youtube"))).thenReturn(Optional.of("1"));

        UrlEntity entity = new UrlEntity("Id", "https://youtube.com", false);
        entity.setFolderPathKey("1");
        entity.setCustomPath("youtube/Id");

        when(urlRepository.findByFolderPathKeyAndShortId("1", "Id")).thenReturn(Optional.of(entity));

        ResponseEntity<?> response = redirectController.redirect(path, request);

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(URI.create("https://youtube.com"), response.getHeaders().getLocation());
        verify(analyticsService).recordClick(eq("youtube/Id"), any(), any(), any());
    }

    @Test
    void shouldRedirectRootBase62SlugWithUppercase() {
        String path = "/bN";
        when(hashOperations.entries("url:entity:path:bN")).thenReturn(Collections.emptyMap());
        when(hashOperations.entries("url:entity:bN")).thenReturn(Collections.emptyMap());

        UrlEntity entity = new UrlEntity("bN", "https://example.com/target", false);
        entity.setFolderPathKey("");
        entity.setCustomPath("bN");

        when(urlRepository.findByFolderPathKeyAndShortId("", "bN")).thenReturn(Optional.of(entity));

        ResponseEntity<?> response = redirectController.redirect(path, request);

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(URI.create("https://example.com/target"), response.getHeaders().getLocation());
        verify(analyticsService).recordClick(eq("bN"), any(), any(), any());
    }

    @Test
    void shouldFallbackToLowercaseForCustomAliases() {
        String path = "/youtube/Programming";
        when(hashOperations.entries("url:entity:path:youtube/Programming")).thenReturn(Collections.emptyMap());
        when(hashOperations.entries("url:entity:path:youtube/programming")).thenReturn(Collections.emptyMap());
        when(folderService.resolveFolderPathKey(List.of("youtube"))).thenReturn(Optional.of("1"));

        UrlEntity entity = new UrlEntity("programming", "https://youtube.com/dev", true);
        entity.setFolderPathKey("1");
        entity.setCustomPath("youtube/programming");

        when(urlRepository.findByFolderPathKeyAndShortId("1", "Programming")).thenReturn(Optional.empty());
        when(urlRepository.findByFolderPathKeyAndShortId("1", "programming")).thenReturn(Optional.of(entity));

        ResponseEntity<?> response = redirectController.redirect(path, request);

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(URI.create("https://youtube.com/dev"), response.getHeaders().getLocation());
    }

    @Test
    void shouldThrowNotFoundWhenUrlDoesNotExist() {
        String path = "/unknown/slug";
        when(hashOperations.entries("url:entity:path:unknown/slug")).thenReturn(Collections.emptyMap());
        when(folderService.resolveFolderPathKey(List.of("unknown"))).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> redirectController.redirect(path, request));
    }
}
