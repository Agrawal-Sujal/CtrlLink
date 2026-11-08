-- ID Range Allocator Table for In-Memory Batch ID Generation (Hi/Lo)
CREATE TABLE IF NOT EXISTS id_range_allocator (
    allocator_name VARCHAR(50) PRIMARY KEY,
    next_id BIGINT NOT NULL
);

-- Seed with a safe initial value or current maximum from urls table if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'urls'
    ) THEN
        INSERT INTO id_range_allocator (allocator_name, next_id)
        SELECT 'url_short_id', COALESCE(MAX(id), 0) + 1000 FROM urls
        ON CONFLICT (allocator_name) DO NOTHING;
    ELSE
        INSERT INTO id_range_allocator (allocator_name, next_id)
        VALUES ('url_short_id', 1000)
        ON CONFLICT (allocator_name) DO NOTHING;
    END IF;
END $$;
