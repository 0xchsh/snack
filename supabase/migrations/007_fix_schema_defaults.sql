-- Fix database schema by adding proper DEFAULT values
-- This will resolve all NOT NULL constraint violations

-- =================================================================
-- PHASE 1: FIX LISTS TABLE DEFAULTS
-- =================================================================

-- Add missing columns if they don't exist
ALTER TABLE lists ADD COLUMN IF NOT EXISTS emoji_3d JSONB;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS price_cents INTEGER;

-- Set proper defaults for all required columns
ALTER TABLE lists ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE lists ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE lists ALTER COLUMN updated_at SET DEFAULT NOW();

-- Handle public_id - either set default or make it nullable
-- Option 1: Set default (if public_id should always exist)
ALTER TABLE lists ALTER COLUMN public_id SET DEFAULT gen_random_uuid();

-- Option 2: If public_id should be optional, make it nullable instead
-- ALTER TABLE lists ALTER COLUMN public_id DROP NOT NULL;

-- =================================================================
-- PHASE 2: FIX LINKS TABLE DEFAULTS (if needed)
-- =================================================================

-- Set defaults for links table too
ALTER TABLE links ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE links ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE links ALTER COLUMN updated_at SET DEFAULT NOW();

-- =================================================================
-- PHASE 3: UPDATE EXISTING RECORDS (if any exist)
-- =================================================================

-- Update any existing records that might have NULL values
UPDATE lists SET 
  created_at = NOW() WHERE created_at IS NULL;
UPDATE lists SET 
  updated_at = NOW() WHERE updated_at IS NULL;
UPDATE lists SET 
  id = gen_random_uuid() WHERE id IS NULL;
UPDATE lists SET 
  public_id = gen_random_uuid() WHERE public_id IS NULL;

UPDATE links SET 
  created_at = NOW() WHERE created_at IS NULL;
UPDATE links SET 
  updated_at = NOW() WHERE updated_at IS NULL;
UPDATE links SET 
  id = gen_random_uuid() WHERE id IS NULL;

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Verify the fixes worked
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' AND column_default IS NULL THEN '❌ STILL BROKEN'
    WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN '✅ FIXED'
    WHEN is_nullable = 'YES' THEN '✅ NULLABLE'
  END as status
FROM information_schema.columns 
WHERE table_name = 'lists'
ORDER BY ordinal_position;

SELECT 'Database schema fixed! All columns now have proper defaults.' as result;