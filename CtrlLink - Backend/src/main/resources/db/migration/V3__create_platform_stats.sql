-- Platform Stats Singleton Table
CREATE TABLE IF NOT EXISTS platform_stats (
    id BIGINT PRIMARY KEY,
    total_clicks BIGINT NOT NULL DEFAULT 0,
    total_links BIGINT NOT NULL DEFAULT 0,
    total_users BIGINT NOT NULL DEFAULT 0
);

-- Seed with actual counts if row 1 does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM platform_stats WHERE id = 1) THEN
        INSERT INTO platform_stats (id, total_clicks, total_links, total_users)
        VALUES (
            1,
            COALESCE((SELECT SUM(click_count) FROM urls), 0),
            (SELECT COUNT(*) FROM urls),
            (SELECT COUNT(*) FROM users)
        );
    END IF;
END $$;
