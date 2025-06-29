-- Add is_public column to lists table
-- This fixes the broken explore page

-- Add the column with default true (all existing lists will be public)
ALTER TABLE lists ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- Add index for better performance on public list queries
CREATE INDEX idx_lists_is_public_updated_at ON lists(is_public, updated_at DESC) WHERE is_public = true;

-- Verify the column was added (run this to check)
-- SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'lists' AND column_name = 'is_public';