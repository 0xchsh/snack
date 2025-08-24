-- Add missing emoji_3d column to lists table
-- This column stores the 3D emoji configuration as JSON

-- Add emoji_3d column if it doesn't exist
ALTER TABLE lists 
ADD COLUMN IF NOT EXISTS emoji_3d JSONB;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'lists' 
  AND column_name IN ('emoji', 'emoji_3d', 'price_cents')
ORDER BY column_name;

SELECT 'Added missing emoji_3d column to lists table' as status;