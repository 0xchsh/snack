-- Migration to implement real Supabase authentication
-- This migration fixes the conflicting schemas and sets up proper auth.users integration

-- =================================================================
-- PHASE 1: CLEAN UP EXISTING SCHEMA
-- =================================================================

-- Drop conflicting RLS policies from hybrid approach
DROP POLICY IF EXISTS "Users can view their own lists" ON lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON lists;

DROP POLICY IF EXISTS "Users can view links in their lists" ON links;
DROP POLICY IF EXISTS "Users can view links in their lists or public lists" ON links;
DROP POLICY IF EXISTS "Users can create links in their lists" ON links;
DROP POLICY IF EXISTS "Users can insert links in their lists" ON links;
DROP POLICY IF EXISTS "Users can update links in their lists" ON links;
DROP POLICY IF EXISTS "Users can delete links from their lists" ON links;
DROP POLICY IF EXISTS "Users can delete links in their lists" ON links;

-- Drop the custom users table policies
DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- =================================================================
-- PHASE 2: CREATE USERS PROFILE TABLE
-- =================================================================

-- Drop the custom users table and create a proper profile table
DROP TABLE IF EXISTS users CASCADE;

-- Create a profiles table that extends auth.users
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
-- PHASE 3: UPDATE FOREIGN KEY REFERENCES
-- =================================================================

-- Update lists table to reference auth.users directly
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_user_id_fkey;
ALTER TABLE lists ADD CONSTRAINT lists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =================================================================
-- PHASE 4: CREATE CLEAN RLS POLICIES
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
-- PHASE 5: CREATE PROFILE MANAGEMENT FUNCTIONS
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
-- PHASE 6: CREATE INDEXES
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- =================================================================
-- VERIFICATION
-- =================================================================

SELECT 'Real Supabase Auth migration completed successfully' as status;