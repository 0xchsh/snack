-- HYBRID COUNTER-CACHE OPTIMIZATION MIGRATION
-- This script implements Option A for ultra-optimized saved lists architecture
-- Run this in your Supabase SQL Editor

-- =================================================================
-- PHASE 1: CRITICAL DATA INTEGRITY FIXES
-- =================================================================

-- 1. Fix NULL user ID emergency (will break cascading deletes)
UPDATE users 
SET id = gen_random_uuid()::text 
WHERE id IS NULL OR id = 'NULL';

-- 2. Fix any NULL list relationships caused by NULL users
UPDATE lists 
SET user_id = (SELECT id FROM users WHERE username = 'test' LIMIT 1)
WHERE user_id IS NULL OR user_id = 'NULL';

-- =================================================================
-- PHASE 2: ID STANDARDIZATION (UUID Migration)
-- =================================================================

-- 3. Standardize users table IDs to UUIDs (if not already UUID format)
-- Note: This preserves existing relationships
ALTER TABLE users ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
UPDATE users SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Update foreign key references before changing primary key
UPDATE lists SET user_id = (SELECT new_id::text FROM users WHERE users.id = lists.user_id);
UPDATE saved_lists SET user_id = (SELECT new_id::text FROM users WHERE users.id = saved_lists.user_id);

-- Replace old ID with new UUID ID
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN new_id TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- 4. Standardize lists table IDs 
ALTER TABLE lists ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
UPDATE lists SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Update foreign key references
UPDATE links SET list_id = (SELECT new_id::text FROM lists WHERE lists.id = links.list_id);
UPDATE saved_lists SET list_id = (SELECT new_id::text FROM lists WHERE lists.id = saved_lists.list_id);

-- Replace old ID with new UUID ID
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_pkey;
ALTER TABLE lists DROP COLUMN id;
ALTER TABLE lists RENAME COLUMN new_id TO id;
ALTER TABLE lists ADD PRIMARY KEY (id);

-- =================================================================
-- PHASE 3: REMOVE REDUNDANT PUBLIC_ID SYSTEM
-- =================================================================

-- 5. Remove redundant public_id (use main ID for public access)
ALTER TABLE lists DROP COLUMN IF EXISTS public_id;

-- =================================================================
-- PHASE 4: OPTIMIZE SAVED_LISTS (HYBRID COUNTER-CACHE)
-- =================================================================

-- 6. Optimize saved_lists table structure
ALTER TABLE saved_lists DROP CONSTRAINT IF EXISTS saved_lists_pkey;
ALTER TABLE saved_lists DROP COLUMN IF EXISTS id;

-- Create composite primary key for optimal performance
ALTER TABLE saved_lists ADD PRIMARY KEY (user_id, list_id);

-- Add metadata columns for enhanced functionality
ALTER TABLE saved_lists ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE saved_lists ADD COLUMN IF NOT EXISTS notes TEXT; -- User's private notes about saved list

-- 7. Add save_count to lists table (counter cache)
ALTER TABLE lists ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Initialize save counts based on existing data
UPDATE lists 
SET save_count = (
  SELECT COUNT(*) 
  FROM saved_lists 
  WHERE saved_lists.list_id = lists.id::text
);

-- =================================================================
-- PHASE 5: PERFORMANCE INDEXES
-- =================================================================

-- 8. Critical performance indexes
CREATE INDEX IF NOT EXISTS idx_saved_lists_user_saved_at ON saved_lists(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_lists_list_saved_at ON saved_lists(list_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_save_count ON lists(save_count DESC) WHERE save_count > 0;
CREATE INDEX IF NOT EXISTS idx_lists_public_save_count ON lists(save_count DESC, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_lists_user_created ON lists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_list_position ON links(list_id, position);

-- =================================================================
-- PHASE 6: AUTOMATIC COUNTER MAINTENANCE
-- =================================================================

-- 9. Create functions for save count maintenance
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists 
    SET save_count = save_count + 1 
    WHERE id = NEW.list_id::uuid;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists 
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.list_id::uuid;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for automatic counter updates
DROP TRIGGER IF EXISTS trigger_update_save_count ON saved_lists;
CREATE TRIGGER trigger_update_save_count
  AFTER INSERT OR DELETE ON saved_lists
  FOR EACH ROW EXECUTE FUNCTION update_list_save_count();

-- =================================================================
-- PHASE 7: DATA CLEANUP
-- =================================================================

-- 11. Remove Clerk remnants if they exist
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;

-- 12. Add email field for better auth compatibility (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- =================================================================
-- PHASE 8: ENHANCED CONSTRAINTS
-- =================================================================

-- 13. Add proper foreign key constraints with cascade
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_user_id_fkey;
ALTER TABLE lists ADD CONSTRAINT lists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE links DROP CONSTRAINT IF EXISTS links_list_id_fkey;
ALTER TABLE links ADD CONSTRAINT links_list_id_fkey 
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;

ALTER TABLE saved_lists DROP CONSTRAINT IF EXISTS saved_lists_user_id_fkey;
ALTER TABLE saved_lists ADD CONSTRAINT saved_lists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE saved_lists DROP CONSTRAINT IF EXISTS saved_lists_list_id_fkey;
ALTER TABLE saved_lists ADD CONSTRAINT saved_lists_list_id_fkey 
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;

-- =================================================================
-- VERIFICATION
-- =================================================================

-- 14. Verify optimization results
SELECT 'OPTIMIZATION COMPLETED SUCCESSFULLY' as status;

SELECT 
  'Users' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT id) as unique_ids
FROM users

UNION ALL

SELECT 
  'Lists' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT id) as unique_ids
FROM lists

UNION ALL

SELECT 
  'Links' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT id) as unique_ids  
FROM links

UNION ALL

SELECT 
  'Saved Lists' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT (user_id, list_id)) as unique_relationships
FROM saved_lists;

-- Show sample of optimized structure
SELECT 
  l.title,
  l.emoji,
  l.save_count,
  COUNT(links.id) as link_count
FROM lists l
LEFT JOIN links ON links.list_id = l.id::text
GROUP BY l.id, l.title, l.emoji, l.save_count
ORDER BY l.save_count DESC, l.created_at DESC
LIMIT 5;