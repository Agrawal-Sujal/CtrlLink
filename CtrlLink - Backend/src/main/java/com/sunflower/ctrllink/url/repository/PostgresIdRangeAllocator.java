package com.sunflower.ctrllink.url.repository;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class PostgresIdRangeAllocator implements IdRangeAllocator {

    private static final Logger log = LoggerFactory.getLogger(PostgresIdRangeAllocator.class);
    private static final long INITIAL_FALLBACK_ID = 1000L;

    private final JdbcTemplate jdbcTemplate;

    public PostgresIdRangeAllocator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS id_range_allocator (" +
                    "allocator_name VARCHAR(50) PRIMARY KEY, " +
                    "next_id BIGINT NOT NULL)"
            );
            jdbcTemplate.update(
                    "INSERT INTO id_range_allocator (allocator_name, next_id) " +
                    "VALUES (?, ?) ON CONFLICT (allocator_name) DO NOTHING",
                    "url_short_id", INITIAL_FALLBACK_ID
            );
        } catch (Exception e) {
            log.warn("Could not auto-initialize id_range_allocator table: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long allocateRange(String allocatorName, int batchSize) {
        log.debug("Executing atomic range update on row '{}' for batchSize={}", allocatorName, batchSize);
        List<Long> result = jdbcTemplate.query(
                "UPDATE id_range_allocator SET next_id = next_id + ? WHERE allocator_name = ? RETURNING next_id - ?",
                (rs, rowNum) -> rs.getLong(1),
                batchSize, allocatorName, batchSize
        );

        if (!result.isEmpty()) {
            long startId = result.get(0);
            log.debug("Successfully reserved ID range [{}, {}] on allocator '{}'", startId, startId + batchSize - 1, allocatorName);
            return startId;
        }

        // If the row doesn't exist yet, seed it and retry
        log.warn("Allocator row '{}' not found in id_range_allocator. Seeding initial row.", allocatorName);
        jdbcTemplate.update(
                "INSERT INTO id_range_allocator (allocator_name, next_id) VALUES (?, ?) ON CONFLICT (allocator_name) DO NOTHING",
                allocatorName, INITIAL_FALLBACK_ID + batchSize
        );

        List<Long> retry = jdbcTemplate.query(
                "UPDATE id_range_allocator SET next_id = next_id + ? WHERE allocator_name = ? RETURNING next_id - ?",
                (rs, rowNum) -> rs.getLong(1),
                batchSize, allocatorName, batchSize
        );

        long startId = retry.isEmpty() ? INITIAL_FALLBACK_ID : retry.get(0);
        log.info("Seeded and reserved initial ID range [{}, {}] on allocator '{}'", startId, startId + batchSize - 1, allocatorName);
        return startId;
    }
}
