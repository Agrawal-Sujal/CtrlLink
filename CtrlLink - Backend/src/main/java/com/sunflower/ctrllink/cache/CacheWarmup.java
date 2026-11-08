package com.sunflower.ctrllink.cache;

import com.sunflower.ctrllink.url.entity.UrlEntity;
import com.sunflower.ctrllink.url.repository.UrlRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class CacheWarmup {

    private static final Logger log = LoggerFactory.getLogger(CacheWarmup.class);

    private final UrlRepository urlRepository;
    private final RedisTemplate<String,String>  redisTemplate;

    public CacheWarmup(UrlRepository urlRepository, RedisTemplate<String, String> redisTemplate) {
        this.urlRepository = urlRepository;
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void preloadCache() {
        long start = System.currentTimeMillis();
        log.info("Starting Redis cache warmup: fetching top popular links...");

        try {
            List<UrlEntity> urls =
                    urlRepository.findTop1000ByOrderByClickCountDesc();

            for(UrlEntity url : urls) {

                // Original simple cache (kept for backward compatibility with getLongUrl)
                String simpleKey = "url:" + url.getShortId();
                redisTemplate.opsForValue().set(simpleKey, url.getLongUrl(), 24, TimeUnit.HOURS);

                // New: Redis Hash cache for redirect hot path (zero-DB redirects)
                String hashKey = "url:entity:" + url.getShortId();
                Map<String, String> fields = new HashMap<>();
                fields.put("longUrl", url.getLongUrl());
                fields.put("hasPassword", String.valueOf(url.getPassword() != null));
                fields.put("title", url.getTitle() != null ? url.getTitle() : "");
                fields.put("expiryTime", url.getExpiryTime() != null
                        ? url.getExpiryTime().toString() : "");

                redisTemplate.opsForHash().putAll(hashKey, fields);
                redisTemplate.expire(hashKey, 24, TimeUnit.HOURS);
            }

            log.info("Cache warmup completed: loaded {} links into Redis in {}ms", urls.size(), (System.currentTimeMillis() - start));
        } catch (Exception e) {
            log.error("Cache warmup failed (application will continue): {}", e.getMessage(), e);
        }
    }
}
