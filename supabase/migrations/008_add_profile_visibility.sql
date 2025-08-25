-- Add profile visibility controls to users table
-- Migration: 008_add_profile_visibility

BEGIN;

-- Add profile_is_public column to users table
-- Default to true to make existing users have public profiles by default
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_is_public BOOLEAN DEFAULT true NOT NULL;

-- Add bio field for public profiles
ALTER TABLE public.users  
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT null;

-- Add comment for clarity
COMMENT ON COLUMN public.users.profile_is_public IS 'Controls whether the user profile is publicly viewable';
COMMENT ON COLUMN public.users.bio IS 'User bio/description for public profile display';

COMMIT;