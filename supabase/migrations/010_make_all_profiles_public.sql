-- Make all profiles public (remove profile privacy feature)
-- Migration: 010_make_all_profiles_public

BEGIN;

-- Update all existing profiles to be public
UPDATE public.users
SET profile_is_public = true
WHERE profile_is_public = false;

-- Change the default to always be true
ALTER TABLE public.users
ALTER COLUMN profile_is_public SET DEFAULT true;

-- Add a check constraint to ensure profile_is_public is always true
ALTER TABLE public.users
ADD CONSTRAINT profiles_always_public CHECK (profile_is_public = true);

-- Update the column comment to reflect the new behavior
COMMENT ON COLUMN public.users.profile_is_public IS 'Always true - all profiles are public (deprecated field, kept for backwards compatibility)';

COMMIT;