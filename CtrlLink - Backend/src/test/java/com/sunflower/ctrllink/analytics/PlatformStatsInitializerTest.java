package com.sunflower.ctrllink.analytics;

import com.sunflower.ctrllink.analytics.entity.GlobalStatsEntity;
import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformStatsInitializerTest {

    @Mock
    private GlobalStatsRepository globalStatsRepository;

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private UserRepository userRepository;

    private PlatformStatsInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new PlatformStatsInitializer(globalStatsRepository, urlRepository, userRepository);
    }

    @Test
    void shouldSeedStatsWhenRowOneDoesNotExist() {
        when(globalStatsRepository.findById(1L)).thenReturn(Optional.empty());
        when(userRepository.count()).thenReturn(5L);
        when(urlRepository.count()).thenReturn(20L);
        when(urlRepository.sumTotalClicks()).thenReturn(150L);
        when(globalStatsRepository.save(any(GlobalStatsEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        GlobalStatsEntity result = initializer.initializeOrReconcileStats();

        ArgumentCaptor<GlobalStatsEntity> captor = ArgumentCaptor.forClass(GlobalStatsEntity.class);
        verify(globalStatsRepository).save(captor.capture());

        GlobalStatsEntity saved = captor.getValue();
        assertEquals(1L, saved.getId());
        assertEquals(5L, saved.getTotalUsers());
        assertEquals(20L, saved.getTotalLinks());
        assertEquals(150L, saved.getTotalClicks());
    }

    @Test
    void shouldNotOverwriteStatsWhenRowOneAlreadyExists() {
        GlobalStatsEntity existing = new GlobalStatsEntity(1L, 100L, 50L, 10L);
        when(globalStatsRepository.findById(1L)).thenReturn(Optional.of(existing));

        GlobalStatsEntity result = initializer.initializeOrReconcileStats();

        assertEquals(existing, result);
        verify(globalStatsRepository, never()).save(any());
        verify(userRepository, never()).count();
        verify(urlRepository, never()).count();
    }
}
