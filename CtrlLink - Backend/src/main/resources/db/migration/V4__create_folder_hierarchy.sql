-- V4: Folder Hierarchy & Advanced Custom URL Paths

-- 1. Create Folder Words Dictionary Table
CREATE TABLE IF NOT EXISTS folder_words (
    id BIGSERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_folder_words_word ON folder_words(word);

-- 2. Add folder_path_key and custom_path to urls table
ALTER TABLE urls 
    ADD COLUMN IF NOT EXISTS folder_path_key VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS custom_path VARCHAR(500);

-- Backfill custom_path for existing root URLs
UPDATE urls SET custom_path = short_id WHERE custom_path IS NULL;

-- 3. Safely drop existing single-column unique constraint on short_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = 'urls'
          AND c.contype = 'u'
          AND array_length(c.conkey, 1) = 1
          AND (
              SELECT attname
              FROM pg_attribute
              WHERE attrelid = t.oid AND attnum = c.conkey[1]
          ) = 'short_id'
    ) LOOP
        EXECUTE 'ALTER TABLE urls DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Drop standalone unique indexes on short_id if any exist without a constraint
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'urls'
          AND indexdef LIKE '%UNIQUE%short_id%'
          AND indexname NOT IN (SELECT conname FROM pg_constraint)
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- 4. Add composite unique constraint for (folder_path_key, short_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_urls_folder_path_short_id'
    ) THEN
        ALTER TABLE urls ADD CONSTRAINT uk_urls_folder_path_short_id UNIQUE (folder_path_key, short_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_urls_folder_path_short_id ON urls(folder_path_key, short_id);
CREATE INDEX IF NOT EXISTS idx_urls_custom_path ON urls(custom_path);
