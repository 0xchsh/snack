-- Diagnose current database schema for lists table
-- Run this to understand the current state

-- Check all columns in lists table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' AND column_default IS NULL THEN '❌ NOT NULL without DEFAULT'
    WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN '✅ NOT NULL with DEFAULT'
    WHEN is_nullable = 'YES' THEN '✅ NULLABLE'
  END as status
FROM information_schema.columns 
WHERE table_name = 'lists'
ORDER BY ordinal_position;

-- Also check links table  
SELECT 
  'LINKS TABLE' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' AND column_default IS NULL THEN '❌ NOT NULL without DEFAULT'
    WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN '✅ NOT NULL with DEFAULT'
    WHEN is_nullable = 'YES' THEN '✅ NULLABLE'
  END as status
FROM information_schema.columns 
WHERE table_name = 'links'
ORDER BY ordinal_position;