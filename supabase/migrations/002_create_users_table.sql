-- Create custom users table for mock authentication
-- This is separate from auth.users to support mock auth in development
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the lists table to reference our custom users table instead of auth.users
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_user_id_fkey;
ALTER TABLE lists ADD CONSTRAINT lists_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Anyone can view user profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (
    id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
  );

CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Update lists policies to work with both auth.uid() and mock users
DROP POLICY IF EXISTS "Users can view their own lists" ON lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON lists;

CREATE POLICY "Users can view their own lists" ON lists
  FOR SELECT USING (
    user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
    OR is_public = true
  );

CREATE POLICY "Users can create their own lists" ON lists
  FOR INSERT WITH CHECK (
    user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
  );

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (
    user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
  );

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (
    user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
  );

-- Update links policies similarly
DROP POLICY IF EXISTS "Users can view links in their lists" ON links;
DROP POLICY IF EXISTS "Users can create links in their lists" ON links;
DROP POLICY IF EXISTS "Users can update links in their lists" ON links;
DROP POLICY IF EXISTS "Users can delete links from their lists" ON links;

CREATE POLICY "Users can view links in their lists" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND (
        lists.user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
        OR lists.is_public = true
      )
    )
  );

CREATE POLICY "Users can create links in their lists" ON links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
    )
  );

CREATE POLICY "Users can update links in their lists" ON links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
    )
  );

CREATE POLICY "Users can delete links from their lists" ON links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id::text = COALESCE(auth.uid()::text, current_setting('app.current_user_id', true))
    )
  );

-- Add trigger for users updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);