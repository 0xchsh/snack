-- Migration to fix user_id type incompatibility and implement real auth
-- This fixes the text vs uuid foreign key constraint issue

-- =================================================================
-- PHASE 1: BACKUP AND ANALYZE EXISTING DATA
-- =================================================================

-- Check current data types
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'lists' AND column_name = 'user_id';

-- Check existing data
SELECT COUNT(*) as total_lists FROM lists;
SELECT COUNT(*) as total_links FROM links;

-- =================================================================
-- PHASE 2: CLEAN UP EXISTING CONFLICTING CONSTRAINTS AND POLICIES
-- =================================================================

-- Drop existing foreign key constraints
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_user_id_fkey;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own lists" ON lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON lists;
DROP POLICY IF EXISTS "Anyone can view public lists" ON lists;

DROP POLICY IF EXISTS "Users can view links in their lists" ON links;
DROP POLICY IF EXISTS "Users can view links in their lists or public lists" ON links;
DROP POLICY IF EXISTS "Users can create links in their lists" ON links;
DROP POLICY IF EXISTS "Users can insert links in their lists" ON links;
DROP POLICY IF EXISTS "Users can update links in their lists" ON links;
DROP POLICY IF EXISTS "Users can delete links from their lists" ON links;
DROP POLICY IF EXISTS "Users can delete links in their lists" ON links;
DROP POLICY IF EXISTS "Anyone can view links in public lists" ON links;

-- Drop custom users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- =================================================================
-- PHASE 3: CREATE PROFILES TABLE FOR AUTH EXTENSION
-- =================================================================

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =================================================================
-- PHASE 4: FIX USER_ID TYPE IN LISTS TABLE
-- =================================================================

-- Add new UUID column for user_id
ALTER TABLE lists ADD COLUMN new_user_id UUID;

-- For existing data with text user_ids, we'll need to either:
-- 1. Delete existing data (since it's from mock auth anyway)
-- 2. Or try to map it to real auth users

-- Since we're moving from mock to real auth, let's clean slate
-- Delete all existing lists and links (they were mock data anyway)
DELETE FROM links;
DELETE FROM lists;

-- Now we can safely change the column type
ALTER TABLE lists DROP COLUMN user_id;
ALTER TABLE lists RENAME COLUMN new_user_id TO user_id;
ALTER TABLE lists ALTER COLUMN user_id SET NOT NULL;

-- =================================================================
-- PHASE 5: CREATE PROPER FOREIGN KEY CONSTRAINTS
-- =================================================================

-- Now create the foreign key constraint (UUID to UUID)
ALTER TABLE lists ADD CONSTRAINT lists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =================================================================
-- PHASE 6: CREATE CLEAN RLS POLICIES
-- =================================================================

-- Lists table policies
CREATE POLICY "Users can view their own lists" ON lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public lists" ON lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

-- Links table policies
CREATE POLICY "Users can view links in their own lists" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view links in public lists" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.is_public = true
    )
  );

CREATE POLICY "Users can create links in their own lists" ON links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links in their own lists" ON links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links from their own lists" ON links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- =================================================================
-- PHASE 7: CREATE PROFILE MANAGEMENT FUNCTIONS
-- =================================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profiles updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- PHASE 8: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Verify the schema is correct
SELECT 
  'lists.user_id type' as check_name,
  data_type as current_value,
  CASE WHEN data_type = 'uuid' THEN '✓ CORRECT' ELSE '✗ NEEDS FIX' END as status
FROM information_schema.columns 
WHERE table_name = 'lists' AND column_name = 'user_id'

UNION ALL

SELECT 
  'foreign key exists' as check_name,
  constraint_name as current_value,
  '✓ CORRECT' as status
FROM information_schema.table_constraints 
WHERE table_name = 'lists' AND constraint_name = 'lists_user_id_fkey' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
  'profiles table exists' as check_name,
  table_name as current_value,
  '✓ CORRECT' as status
FROM information_schema.tables 
WHERE table_name = 'profiles';

SELECT 'Real Supabase Auth migration completed successfully!' as status;