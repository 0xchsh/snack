-- Clean up database schema: rename items to links and remove Clerk remnants
-- Run this in your Supabase SQL Editor

-- 1. Rename the items table to links
ALTER TABLE items RENAME TO links;

-- 2. Rename columns in links table to match expected schema
ALTER TABLE links RENAME COLUMN "order" TO position;
ALTER TABLE links RENAME COLUMN image TO image_url;
ALTER TABLE links RENAME COLUMN favicon TO favicon_url;

-- 3. Clean up old indexes for items table
DROP INDEX IF EXISTS idx_items_list_id;
DROP INDEX IF EXISTS idx_items_order;

-- 4. Create new indexes for links table
CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

-- 5. Update triggers for links table
DROP TRIGGER IF EXISTS update_items_updated_at ON links;

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

-- 6. Remove Clerk remnants from users table
-- Note: This will remove the clerk_id column - make sure you don't need it!
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;

-- 7. Optionally add email column to users table for better compatibility
-- (Only if you want to support email-based lookups in the future)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- 8. Verify the changes
SELECT 'Schema cleanup completed successfully' as status;

-- 9. Show the updated table structures
SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Links table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'links' AND table_schema = 'public'
ORDER BY ordinal_position;