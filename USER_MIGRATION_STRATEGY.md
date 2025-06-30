# User Migration Strategy: Clerk to Supabase Auth

## 🎯 Migration Goals

1. **Zero Data Loss**: Preserve all user data and lists
2. **Minimal Disruption**: Users shouldn't lose access or need to recreate accounts
3. **Smooth Transition**: Gradual migration with fallback options
4. **Data Integrity**: Maintain all relationships and references

## 📋 Current State Analysis

### What We Have (Clerk):
- Users authenticated via Clerk with `clerk_id` stored in database
- User profiles with email, username, firstName, lastName
- Lists and items linked to users via `user_id` (internal DB ID)
- Profile pictures hosted by Clerk

### What We Need (Supabase):
- Users authenticated via Supabase Auth with `auth.uid()` as primary key
- Same user profile data structure
- Preserve all existing relationships
- Migrate or preserve profile pictures

## 🔄 Migration Strategy: Hybrid Approach

### Phase 1: Preparation (No User Impact)
1. **Setup Supabase Auth** (✅ Already done)
2. **Update Database Schema**:
   ```sql
   -- Add Supabase auth_id column to users table
   ALTER TABLE users ADD COLUMN auth_id UUID;
   CREATE INDEX idx_users_auth_id ON users(auth_id);
   
   -- Make clerk_id nullable for new users
   ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;
   ```

3. **Update User Creation Logic** to support both systems
4. **Create Migration Utilities**

### Phase 2: Dual Authentication (Gradual Migration)
1. **Enable Both Systems**: Clerk for existing users, Supabase for new users
2. **Smart Authentication Logic**:
   - Check if user exists in Supabase Auth first
   - Fall back to Clerk for existing users
   - Gradually migrate users on login

3. **User-Initiated Migration**:
   - Add "Migrate Account" button in profile settings
   - Allow users to migrate their own accounts voluntarily

### Phase 3: Forced Migration (Planned Event)
1. **Notification Period**: 2-4 weeks notice to all users
2. **Bulk Migration**: Migrate remaining users
3. **Remove Clerk Dependencies**

## 🔧 Technical Implementation

### 1. Database Schema Updates

```sql
-- Add Supabase auth_id column
ALTER TABLE users ADD COLUMN auth_id UUID;
ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;

-- Create index for performance
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- Add migration tracking
ALTER TABLE users ADD COLUMN migrated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN migration_source VARCHAR(20) DEFAULT 'clerk';
```

### 2. Hybrid Auth System

Create a new auth wrapper that handles both systems:

```typescript
// lib/hybrid-auth.ts
export const hybridAuth = {
  getCurrentUser: async () => {
    // Try Supabase first
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { user, source: 'supabase' };
    }
    
    // Fall back to Clerk
    const clerkUser = await currentUser();
    if (clerkUser) {
      return { user: clerkUser, source: 'clerk' };
    }
    
    return { user: null, source: null };
  }
};
```

### 3. Migration Utilities

```typescript
// lib/migration.ts
export const migrationUtils = {
  // Check if user needs migration
  needsMigration: async (clerkId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('users')
      .select('auth_id')
      .eq('clerk_id', clerkId)
      .single();
    
    return !data?.auth_id;
  },

  // Migrate single user
  migrateUser: async (clerkUser: ClerkUser): Promise<MigrationResult> => {
    try {
      // 1. Create Supabase auth user
      const { data: authUser, error: authError } = await adminAuth.createUser(
        clerkUser.emailAddresses[0].emailAddress,
        generateSecurePassword(), // They'll reset via email
        {
          username: clerkUser.username,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
        }
      );

      if (authError) throw authError;

      // 2. Update database record
      const { error: dbError } = await supabase
        .from('users')
        .update({
          auth_id: authUser.user.id,
          migrated_at: new Date().toISOString(),
          migration_source: 'clerk',
        })
        .eq('clerk_id', clerkUser.id);

      if (dbError) throw dbError;

      // 3. Send password reset email
      await supabase.auth.resetPasswordForEmail(
        clerkUser.emailAddresses[0].emailAddress,
        { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password` }
      );

      return { success: true, authUserId: authUser.user.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Bulk migration script
  bulkMigrate: async (): Promise<BulkMigrationResult> => {
    // Get all non-migrated users
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .is('auth_id', null)
      .not('clerk_id', 'is', null);

    const results = [];
    for (const user of users) {
      // Get Clerk user data and migrate
      // (This would require Clerk API calls)
    }

    return { total: users.length, successful: results.filter(r => r.success).length };
  }
};
```

## 📅 Migration Timeline

### Week 1-2: Development & Testing
- ✅ Setup Supabase Auth infrastructure
- 🔄 Create hybrid auth system
- 🔄 Build migration utilities
- 🔄 Test migration process thoroughly

### Week 3: Soft Launch
- Deploy hybrid system to production
- Enable new user registration via Supabase
- Add voluntary migration option for existing users
- Monitor system performance

### Week 4-5: User Communication
- Email all users about upcoming migration
- Add in-app notifications about benefits
- Provide migration FAQ and support
- Continue voluntary migrations

### Week 6: Bulk Migration
- Schedule maintenance window
- Run bulk migration script
- Verify all data integrity
- Switch to Supabase-only mode

### Week 7: Cleanup
- Remove Clerk dependencies
- Clean up hybrid code
- Update documentation
- Monitor for issues

## 🛡️ Risk Mitigation

### 1. Data Backup
```sql
-- Create backup tables before migration
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE lists_backup AS SELECT * FROM lists;
```

### 2. Rollback Plan
- Keep Clerk configuration active during transition
- Ability to revert auth checks to Clerk
- Database rollback scripts prepared

### 3. Testing Strategy
- Test migration with dummy data first
- Verify all user flows work with both auth systems
- Load testing with hybrid system
- User acceptance testing

### 4. Monitoring
- Track migration success rates
- Monitor authentication failures
- Watch for performance issues
- User support tickets tracking

## 🎯 Success Metrics

- **0% Data Loss**: All users and their data preserved
- **>95% Successful Migrations**: Minimal manual intervention needed
- **<2 Hours Downtime**: For bulk migration window
- **Improved Performance**: Faster auth checks and reduced API calls

## 📞 User Communication Template

### Email to Users:
```
Subject: Important Account Update - Action Required

Hi [Username],

We're upgrading our authentication system to provide you with better security and performance. 

What's changing:
- More secure login process
- Faster page loads
- Better integration with your lists

What you need to do:
1. Click "Migrate Account" in your profile settings (optional - can be done anytime)
2. Or wait for automatic migration on [DATE]
3. Check your email for password reset instructions

Your lists and data will be preserved throughout this process.

Questions? Reply to this email or contact support.

Thanks,
The Snack Team
```

This migration strategy ensures a smooth transition while minimizing user disruption and maintaining data integrity.