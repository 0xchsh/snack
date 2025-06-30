# User Migration Guide: Clerk to Supabase

This guide provides step-by-step instructions for migrating users from Clerk to Supabase Auth.

## Prerequisites

Before starting the migration, ensure you have:

1. **Supabase Project Setup**: Your Supabase project is configured with proper Auth settings
2. **Environment Variables**: All required environment variables are set
3. **Database Schema**: User tables are properly set up in Supabase
4. **Backup**: A backup of your current user data
5. **Testing Environment**: Test the migration process in staging first

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk (for migration only)
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Migration Process

### Step 1: Install Dependencies

```bash
npm install tsx
```

### Step 2: Check Migration Status

Before starting, check the current state:

```bash
npm run migrate:status
```

### Step 3: Run Migration

**⚠️ Warning**: Test this in staging first!

```bash
npm run migrate:users
```

The script will:
1. Fetch all users from Clerk
2. Transform user data for Supabase
3. Create a backup file (`migration-backup.json`)
4. Create users in Supabase Auth
5. Update user profiles in the database

### Step 4: Verify Migration

After migration, verify that:

1. **Users can sign in**: Test with existing user credentials
2. **User data is intact**: Check that usernames, profiles, etc. are correct
3. **Lists are accessible**: Ensure user-owned lists are still accessible
4. **Permissions work**: Test that users can only access their own data

## Migration Script Features

### Safe Migration
- Creates backup files before migration
- Asks for confirmation before proceeding
- Provides detailed progress logging
- Handles errors gracefully

### User Data Mapping
- **Email**: Primary verified email from Clerk
- **Username**: Preserved from Clerk
- **Profile**: First name, last name, profile image
- **Metadata**: Public and private metadata preserved
- **Timestamps**: Original creation/update times preserved

### Error Handling
- Skips users without valid email addresses
- Logs failed migrations for manual review
- Continues processing even if some users fail
- Provides summary of success/failure counts

## Post-Migration Steps

### 1. Test Authentication Flows

Test all authentication scenarios:
- Sign in with email/password
- Social authentication (Google)
- Password reset
- Profile updates

### 2. Update User References

If you have any hardcoded Clerk user IDs in your database:

```sql
-- Find references to Clerk user IDs
SELECT * FROM lists WHERE user_id LIKE 'user_%';
SELECT * FROM saved_lists WHERE user_id LIKE 'user_%';

-- Update with Supabase user IDs (manual process)
-- You'll need to match based on email or username
```

### 3. Clean Up

Once migration is complete and tested:

1. Remove Clerk environment variables
2. Remove Clerk dependencies from package.json
3. Delete any remaining Clerk-specific code
4. Update documentation

### 4. User Communication

Consider sending users an email about the migration:
- Explain that their account has been migrated
- Mention any changes they might notice
- Provide contact information for support

## Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
- Ensure all required env vars are set in `.env.local`
- Check that your Supabase project is configured correctly

**2. "Clerk API error: 401"**
- Verify your `CLERK_SECRET_KEY` is correct
- Check that the key has proper permissions

**3. "User creation failed"**
- Check Supabase Auth configuration
- Verify email domain restrictions
- Check Supabase logs for detailed errors

**4. "Username already exists"**
- Handle username conflicts manually
- Consider adding a suffix to duplicate usernames

### Manual User Creation

If the automated migration fails for some users, you can create them manually:

```javascript
// Example manual user creation
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  email_confirm: true,
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    clerk_id: 'user_clerk_id_here',
    migrated_at: new Date().toISOString(),
  },
});
```

## Rollback Strategy

If you need to rollback the migration:

1. **Keep Clerk configuration**: Don't remove Clerk until migration is confirmed successful
2. **Use backup data**: The migration script creates `migration-backup.json` for reference
3. **Database cleanup**: Remove migrated users from Supabase if needed

```sql
-- Remove migrated users (be careful!)
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'clerk_id' IS NOT NULL;
```

## Testing Checklist

Before going live with the migration:

- [ ] Test migration in staging environment
- [ ] Verify all user data is correctly migrated
- [ ] Test sign-in with existing users
- [ ] Test password reset functionality
- [ ] Test social authentication
- [ ] Verify user permissions and data access
- [ ] Test profile updates
- [ ] Check that lists and saved items work correctly
- [ ] Performance test with realistic user count

## Support

If you encounter issues during migration:

1. Check the migration logs for specific error messages
2. Verify your environment configuration
3. Test with a small subset of users first
4. Check Supabase dashboard for Auth logs
5. Review the backup file to ensure data integrity

## Security Considerations

- **Service Role Key**: Keep the Supabase service role key secure and never commit it
- **Email Verification**: Migrated users have email verification bypassed
- **Password Reset**: Users may need to reset passwords after migration
- **Session Management**: Existing sessions will be invalidated