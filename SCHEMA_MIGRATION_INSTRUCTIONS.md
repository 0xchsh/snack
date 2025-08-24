# Database Schema Migration Instructions

This document explains how to apply the fresh database schema to get the app working with real Supabase authentication and data persistence.

## Current Status

The app has been updated to use real Supabase authentication instead of mock localStorage authentication. However, the database schema needs to be applied to match the updated code.

## Migration Steps

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Navigate to your project
   - Go to the SQL Editor

2. **Delete existing conflicting tables** (if they exist)
   ```sql
   DROP TABLE IF EXISTS public.links CASCADE;
   DROP TABLE IF EXISTS public.lists CASCADE;
   DROP TABLE IF EXISTS public.profiles CASCADE;
   DROP TABLE IF EXISTS public.users CASCADE;
   DROP TABLE IF EXISTS public.saved_lists CASCADE;
   ```

3. **Apply the fresh schema**
   - Open the file `supabase/migrations/FRESH_START_COMPLETE_SCHEMA.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Run the migration

## What This Migration Creates

### Tables
- **users** - User profiles extending auth.users
- **lists** - User-created lists with titles, emojis, and metadata  
- **links** - Individual links within lists
- **saved_lists** - Many-to-many relationship for users saving other users' lists

### Features
- **Row Level Security (RLS)** - Secure access policies
- **Automatic timestamps** - created_at/updated_at triggers
- **UUID generation** - Automatic primary keys
- **Counter caching** - save_count optimization
- **Performance indexes** - Query optimization
- **Automatic user creation** - Trigger creates user record on auth signup

### Security
- Users can only see/edit their own lists and links
- Public lists are viewable by anyone
- RLS policies prevent unauthorized access
- Session-based authentication required

## After Migration

Once the schema is applied:

1. **Test authentication** - Sign up/sign in should work
2. **Test list creation** - Lists should persist after page refresh  
3. **Verify data persistence** - No more localStorage fallback

## Verification

The migration includes verification queries that will show:
- All tables created successfully
- Column counts for each table
- Success confirmation message

If you see any errors during migration, check that:
- All existing conflicting tables were dropped first
- You have the required permissions in Supabase
- Your Supabase project is active and not paused

## Rollback

If needed, you can rollback by dropping all tables:
```sql
DROP TABLE IF EXISTS public.saved_lists CASCADE;
DROP TABLE IF EXISTS public.links CASCADE; 
DROP TABLE IF EXISTS public.lists CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

Then apply any previous migration files or start fresh.