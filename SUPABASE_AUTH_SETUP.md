# Supabase Auth Migration Setup Guide

This guide covers the setup required for migrating from Clerk to Supabase Auth.

## 🔐 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# New variable required for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🎯 Supabase Dashboard Configuration

### 1. Enable Email Authentication
1. Go to **Authentication > Settings** in your Supabase dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email templates if desired

### 2. Configure OAuth Providers (Optional)

#### GitHub OAuth:
1. Go to **Authentication > Settings > Auth Providers**
2. Enable **GitHub**
3. Add your GitHub OAuth app credentials:
   - **Client ID**: From your GitHub OAuth app
   - **Client Secret**: From your GitHub OAuth app
   - **Redirect URL**: Use the provided Supabase URL

#### Google OAuth:
1. Enable **Google** in Auth Providers
2. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

#### Discord OAuth:
1. Enable **Discord** in Auth Providers
2. Add your Discord OAuth credentials

### 3. Configure Auth Settings
1. Go to **Authentication > Settings**
2. Set **Site URL**: `http://localhost:3001` (development) or your production URL
3. Add **Redirect URLs**:
   - `http://localhost:3001/auth/callback`
   - `http://localhost:3001/auth/reset-password`
   - Add your production URLs when deploying

### 4. Database Policies (RLS)

Run these SQL commands in your Supabase SQL Editor to set up Row Level Security:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Lists table policies
CREATE POLICY "Users can view own lists" ON lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lists" ON lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

-- Items table policies
CREATE POLICY "Users can view items in accessible lists" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = items.list_id 
      AND (lists.user_id = auth.uid() OR lists.is_public = true)
    )
  );

CREATE POLICY "Users can manage items in own lists" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = items.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Saved lists table policies
CREATE POLICY "Users can view own saved lists" ON saved_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved lists" ON saved_lists
  FOR ALL USING (auth.uid() = user_id);
```

### 5. Database Functions (Optional)

Create helper functions for common operations:

```sql
-- Function to get user's database ID from auth.uid()
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.uid();
$$;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION is_username_available(username_to_check text, exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY definer
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM users 
    WHERE username = username_to_check 
    AND (exclude_user_id IS NULL OR id != exclude_user_id)
  );
$$;
```

## 🔄 Migration Steps After Setup

1. **Test the auth configuration** by creating a new account
2. **Update your application** to use the new auth system
3. **Create a migration script** for existing users
4. **Test all authentication flows** thoroughly
5. **Deploy and monitor** the new system

## 🚨 Important Notes

- **Backup your data** before starting the migration
- **Test thoroughly** in development before deploying
- **Plan for user downtime** during the migration
- **Have a rollback plan** ready
- **Monitor error logs** closely after deployment

## 🔧 Testing the Setup

Once configured, you can test the auth system:

1. Start your development server
2. Navigate to `/auth/sign-in` (will be created next)
3. Try creating a new account
4. Test OAuth providers if configured
5. Verify user data appears in your Supabase database

## 📝 Next Steps

After completing this setup:
1. ✅ Create sign-in/sign-up pages
2. ✅ Update all API routes to use Supabase auth
3. ✅ Replace Clerk components with Supabase equivalents
4. ✅ Test and migrate existing users