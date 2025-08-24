-- SAFE MIGRATION: Fix data integrity issues first
-- Run this ONE COMMAND at a time in Supabase SQL Editor

-- Step 1: Check current data integrity issues
SELECT 
  'Data Integrity Check' as phase,
  (SELECT COUNT(*) FROM users WHERE id IS NULL OR id = 'NULL') as null_users,
  (SELECT COUNT(*) FROM lists WHERE user_id IS NULL OR user_id = 'NULL') as null_list_users,
  (SELECT COUNT(*) FROM lists WHERE user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL)) as orphaned_lists;

-- Step 2: Fix NULL user IDs first
UPDATE users 
SET id = 'user_' || gen_random_uuid()::text 
WHERE id IS NULL OR id = 'NULL';

-- Step 3: Create a default user for orphaned lists
INSERT INTO users (id, username, first_name, last_name)
VALUES ('default-user-' || gen_random_uuid()::text, 'default_user', 'Default', 'User')
ON CONFLICT (username) DO NOTHING;

-- Step 4: Fix orphaned lists by assigning them to an existing user
UPDATE lists 
SET user_id = (SELECT id FROM users LIMIT 1)
WHERE user_id IS NULL 
   OR user_id = 'NULL' 
   OR user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);

-- Step 5: Check if items table exists, if not create it as links
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'links') THEN
    -- Rename items to links if items exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'items') THEN
      ALTER TABLE items RENAME TO links;
      ALTER TABLE links RENAME COLUMN "order" TO position;
      ALTER TABLE links RENAME COLUMN image TO image_url;
      ALTER TABLE links RENAME COLUMN favicon TO favicon_url;
    ELSE
      -- Create links table from scratch
      CREATE TABLE links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        list_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        image_url TEXT,
        favicon_url TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    END IF;
  END IF;
END $$;

-- Step 6: Add save_count to lists if it doesn't exist
ALTER TABLE lists ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Step 7: Update save counts based on existing saved_lists data
UPDATE lists 
SET save_count = COALESCE((
  SELECT COUNT(*) 
  FROM saved_lists 
  WHERE saved_lists.list_id = lists.id
), 0);

-- Step 8: Add critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_save_count ON lists(save_count DESC) WHERE save_count > 0;
CREATE INDEX IF NOT EXISTS idx_saved_lists_user_list ON saved_lists(user_id, list_id);
CREATE INDEX IF NOT EXISTS idx_links_list_position ON links(list_id, position);

-- Step 9: Remove clerk_id if it exists
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;

-- Step 10: Verification
SELECT 'MIGRATION COMPLETED SUCCESSFULLY' as status;

SELECT 
  'Final Data Check' as phase,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM lists) as total_lists,
  (SELECT COUNT(*) FROM links) as total_links,
  (SELECT COUNT(*) FROM saved_lists) as total_saves;