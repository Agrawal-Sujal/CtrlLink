package com.sunflower.ctrllink.analytics;

import com.sunflower.ctrllink.analytics.entity.GlobalStatsEntity;
import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import com.sunflower.ctrllink.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@Order(10)
public class PlatformStatsInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformStatsInitializer.class);

    private final GlobalStatsRepository globalStatsRepository;
    private final UrlRepository urlRepository;
    private final UserRepository userRepository;

    public PlatformStatsInitializer(GlobalStatsRepository globalStatsRepository,
                                    UrlRepository urlRepository,
                                    UserRepository userRepository) {
        this.globalStatsRepository = globalStatsRepository;
        this.urlRepository = urlRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initializeOrReconcileStats();
    }

    @Transactional
    public GlobalStatsEntity initializeOrReconcileStats() {
        Optional<GlobalStatsEntity> statsOpt = globalStatsRepository.findById(1L);
        if (statsOpt.isEmpty()) {
            log.info("platform_stats row 1 is missing. Seeding platform_stats from database counts...");
            long totalUsers = userRepository.count();
            long totalLinks = urlRepository.count();
            long totalClicks = urlRepository.sumTotalClicks();

            GlobalStatsEntity stats = new GlobalStatsEntity(1L, totalClicks, totalLinks, totalUsers);
            GlobalStatsEntity saved = globalStatsRepository.save(stats);
            log.info("Successfully initialized platform_stats: users={}, links={}, clicks={}",
                    totalUsers, totalLinks, totalClicks);
            return saved;
        } else {
            GlobalStatsEntity stats = statsOpt.get();
            log.debug("platform_stats row 1 already initialized: users={}, links={}, clicks={}",
                    stats.getTotalUsers(), stats.getTotalLinks(), stats.getTotalClicks());
            return stats;
        }
    }
}
