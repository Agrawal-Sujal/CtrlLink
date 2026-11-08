package com.sunflower.ctrllink.analytics.repository;

import com.sunflower.ctrllink.analytics.entity.GlobalStatsEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GlobalStatsRepository extends JpaRepository<GlobalStatsEntity, Long> {

    @Transactional
    @Modifying
    @Query("UPDATE GlobalStatsEntity g SET g.totalClicks = g.totalClicks + :count WHERE g.id = 1")
    void incrementClicks(@Param("count") long count);

    @Transactional
    @Modifying
    @Query("UPDATE GlobalStatsEntity g SET g.totalLinks = g.totalLinks + 1 WHERE g.id = 1")
    void incrementLinks();

    @Transactional
    @Modifying
    @Query("UPDATE GlobalStatsEntity g SET g.totalLinks = CASE WHEN g.totalLinks >= :count THEN g.totalLinks - :count ELSE 0 END WHERE g.id = 1")
    void decrementLinks(@Param("count") long count);

    @Transactional
    @Modifying
    @Query("UPDATE GlobalStatsEntity g SET g.totalUsers = g.totalUsers + 1 WHERE g.id = 1")
    void incrementUsers();
    
    default GlobalStatsEntity getStats() {
        return findById(1L).orElseGet(() -> save(new GlobalStatsEntity(1L, 0L, 0L, 0L)));
    }
}
