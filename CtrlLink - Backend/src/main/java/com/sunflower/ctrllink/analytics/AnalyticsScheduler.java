package com.sunflower.ctrllink.analytics;

import com.sunflower.ctrllink.analytics.repository.GlobalStatsRepository;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class AnalyticsScheduler {

    private final RedisTemplate<String,String> redisTemplate;
    private final UrlRepository urlRepository;
    private static final Logger log = LoggerFactory.getLogger(AnalyticsScheduler.class);

    private static final String SOURCE_KEY = "analytics:click_counts";
    private static final String LOCK_KEY = "analytics:sync:lock";

    private final GlobalStatsRepository globalStatsRepository;

    public AnalyticsScheduler(RedisTemplate<String, String> redisTemplate,
                              UrlRepository urlRepository,
                              GlobalStatsRepository globalStatsRepository) {
        this.redisTemplate = redisTemplate;
        this.urlRepository = urlRepository;
        this.globalStatsRepository = globalStatsRepository;
    }

    @Scheduled(fixedRate = 30000)
    public void syncClicksToDatabase() {

        // Distributed lock — only ONE instance runs this at a time
        String lockValue = UUID.randomUUID().toString();
        log.debug("Attempting to acquire distributed lock '{}' with token={}", LOCK_KEY, lockValue);

        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(LOCK_KEY, lockValue, 25, TimeUnit.SECONDS);

        if (locked == null || !locked) {
            log.debug("Distributed lock '{}' held by another node or busy. Skipping sync.", LOCK_KEY);
            return;
        }

        log.info("Acquired distributed lock '{}' (token={}, TTL=25s)", LOCK_KEY, lockValue);
        long startTime = System.currentTimeMillis();

        try {
            Boolean exists = redisTemplate.hasKey(SOURCE_KEY);
            if (exists == null || !exists) {
                log.debug("No pending click counts found at '{}'", SOURCE_KEY);
                return;
            }

            // Unique processing key per run — no collision between instances
            String processingKey = "click_counts_processing:" + lockValue;
            redisTemplate.rename(SOURCE_KEY, processingKey);

            Map<Object, Object> counters = redisTemplate.opsForHash().entries(processingKey);
            log.info("ANALYTICS SYNC started: found {} items to aggregate", counters.size());

            long totalBatchClicks = 0;
            for (Map.Entry<Object, Object> entry : counters.entrySet()) {
                String shortId = (String) entry.getKey();
                long count = Long.parseLong(entry.getValue().toString());
                urlRepository.incrementClickCount(shortId, count);
                totalBatchClicks += count;
            }

            if (totalBatchClicks > 0) {
                globalStatsRepository.incrementClicks(totalBatchClicks);
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("ANALYTICS SYNC completed: processed {} links, {} total clicks in {}ms",
                    counters.size(), totalBatchClicks, duration);
            redisTemplate.delete(processingKey);

        } catch (Exception e) {
            log.error("Exception during analytics sync execution under lock {}: {}", lockValue, e.getMessage(), e);
        } finally {
            // Only delete lock if WE own it
            String currentLock = redisTemplate.opsForValue().get(LOCK_KEY);
            if (lockValue.equals(currentLock)) {
                redisTemplate.delete(LOCK_KEY);
                log.info("Released distributed lock '{}' (token={})", LOCK_KEY, lockValue);
            } else {
                log.warn("Lock '{}' expired or was overwritten before release (current={}, expected={})",
                        LOCK_KEY, currentLock, lockValue);
            }
        }
    }
}
