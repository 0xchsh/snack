-- Make lists public by default
-- Migration: 009_make_lists_public_by_default

BEGIN;

-- Change the default value for is_public column in lists table to true
ALTER TABLE public.lists
ALTER COLUMN is_public SET DEFAULT true;

-- Update all existing lists that have is_public as false to make them public
-- This is optional - comment out if you want to preserve existing privacy settings
UPDATE public.lists
SET is_public = true
WHERE is_public = false;

-- Add comment for clarity
COMMENT ON COLUMN public.lists.is_public IS 'Controls whether the list is publicly viewable (default: true)';

COMMIT;