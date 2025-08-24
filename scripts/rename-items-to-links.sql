-- Rename items table to links and update schema to match expected format
-- Run this in your Supabase SQL Editor

-- 1. Rename the table
ALTER TABLE items RENAME TO links;

-- 2. Rename columns to match expected schema
ALTER TABLE links RENAME COLUMN "order" TO position;
ALTER TABLE links RENAME COLUMN image TO image_url;
ALTER TABLE links RENAME COLUMN favicon TO favicon_url;

-- 3. Update any indexes that reference the old table name
DROP INDEX IF EXISTS idx_items_list_id;
DROP INDEX IF EXISTS idx_items_order;

-- 4. Create new indexes with correct names
CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

-- 5. Update any triggers that reference the old table name
DROP TRIGGER IF EXISTS update_items_updated_at ON links;

-- 6. Create new trigger for updated_at
CREATE OR REPLACE FUNCTION update_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_links_updated_at 
BEFORE UPDATE ON links
FOR EACH ROW EXECUTE FUNCTION update_links_updated_at();

-- 7. Verify the changes
SELECT 'Table renamed successfully' as status;