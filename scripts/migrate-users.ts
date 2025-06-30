#!/usr/bin/env tsx

/**
 * User Migration Script: Clerk to Supabase
 * 
 * This script helps migrate users from Clerk to Supabase Auth.
 * It exports user data from Clerk and provides guidance for manual migration.
 * 
 * Usage:
 * npm install -g tsx
 * tsx scripts/migrate-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification?: {
      status: string;
    };
  }>;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_image_url?: string;
  created_at: number;
  updated_at: number;
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
}

interface MigrationUser {
  clerk_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Fetch users from Clerk API
 */
async function fetchClerkUsers(): Promise<ClerkUser[]> {
  if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in environment variables');
    console.error('Please add CLERK_SECRET_KEY to your .env.local file');
    return [];
  }

  try {
    console.log('📥 Fetching users from Clerk...');
    
    const response = await fetch('https://api.clerk.dev/v1/users', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Clerk API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ Found ${data.length} users in Clerk`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching Clerk users:', error);
    return [];
  }
}

/**
 * Transform Clerk user to migration format
 */
function transformClerkUser(clerkUser: ClerkUser): MigrationUser | null {
  const primaryEmail = clerkUser.email_addresses.find(
    email => email.verification?.status === 'verified'
  ) || clerkUser.email_addresses[0];

  if (!primaryEmail) {
    console.warn(`⚠️  User ${clerkUser.id} has no email address, skipping`);
    return null;
  }

  return {
    clerk_id: clerkUser.id,
    email: primaryEmail.email_address,
    username: clerkUser.username,
    first_name: clerkUser.first_name,
    last_name: clerkUser.last_name,
    profile_image_url: clerkUser.profile_image_url,
    created_at: new Date(clerkUser.created_at).toISOString(),
    updated_at: new Date(clerkUser.updated_at).toISOString(),
    metadata: {
      ...clerkUser.public_metadata,
      ...clerkUser.private_metadata,
    },
  };
}

/**
 * Create user in Supabase Auth
 */
async function createSupabaseUser(user: MigrationUser): Promise<boolean> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Skip email verification for migrated users
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_image_url: user.profile_image_url,
        clerk_id: user.clerk_id,
        migrated_at: new Date().toISOString(),
        ...user.metadata,
      },
    });

    if (authError) {
      console.error(`❌ Error creating auth user (${user.email}):`, authError.message);
      return false;
    }

    console.log(`✅ Created Supabase user: ${user.email} (${authData.user.id})`);

    // Update the user profile in the database
    if (user.username) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.profile_image_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
        });

      if (profileError) {
        console.warn(`⚠️  Error updating profile for ${user.email}:`, profileError.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Unexpected error creating user (${user.email}):`, error);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('🚀 Starting user migration from Clerk to Supabase...\n');

  // Step 1: Fetch users from Clerk
  const clerkUsers = await fetchClerkUsers();
  if (clerkUsers.length === 0) {
    console.log('ℹ️  No users found in Clerk or unable to fetch. Exiting.');
    return;
  }

  // Step 2: Transform users
  console.log('🔄 Transforming user data...');
  const migrationUsers = clerkUsers
    .map(transformClerkUser)
    .filter((user): user is MigrationUser => user !== null);

  console.log(`✅ Prepared ${migrationUsers.length} users for migration\n`);

  // Step 3: Export user data to file for backup
  const exportPath = join(process.cwd(), 'migration-backup.json');
  writeFileSync(exportPath, JSON.stringify(migrationUsers, null, 2));
  console.log(`💾 User data exported to: ${exportPath}\n`);

  // Step 4: Ask for confirmation
  console.log('⚠️  WARNING: This will create users in Supabase Auth');
  console.log('⚠️  Make sure you have tested this in a staging environment first');
  console.log('\nPress Ctrl+C to cancel, or any key to continue...');
  
  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    
    // Step 5: Migrate users to Supabase
    console.log('\n🔄 Starting migration to Supabase...');
    let successCount = 0;
    let failureCount = 0;

    for (const user of migrationUsers) {
      const success = await createSupabaseUser(user);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`❌ Failed to migrate: ${failureCount} users`);
    console.log(`💾 Backup saved to: ${exportPath}`);

    if (failureCount > 0) {
      console.log('\n⚠️  Some users failed to migrate. Check the logs above for details.');
      console.log('You can re-run this script to retry failed migrations.');
    }

    console.log('\n🎉 Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Test authentication flows with migrated users');
    console.log('2. Update any user references in your database to use Supabase user IDs');
    console.log('3. Consider sending notification emails to users about the migration');
    console.log('4. Remove Clerk configuration once everything is working');
    
    process.exit(0);
  });
}

/**
 * Utility function to check migration status
 */
async function checkMigrationStatus() {
  console.log('📊 Checking migration status...\n');

  try {
    // Get count of users with clerk_id in metadata
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching Supabase users:', error.message);
      return;
    }

    const migratedUsers = users.users.filter(user => 
      user.user_metadata?.clerk_id
    );

    console.log(`📈 Total Supabase users: ${users.users.length}`);
    console.log(`🔄 Migrated users (with clerk_id): ${migratedUsers.length}`);
    
    if (migratedUsers.length > 0) {
      console.log('\n📋 Recent migrated users:');
      migratedUsers.slice(0, 5).forEach(user => {
        console.log(`  - ${user.email} (migrated: ${user.user_metadata?.migrated_at || 'unknown'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
  }
}

// CLI Interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateUsers();
    break;
  case 'status':
    checkMigrationStatus();
    break;
  default:
    console.log('📚 User Migration Script - Clerk to Supabase\n');
    console.log('Available commands:');
    console.log('  migrate  - Start the migration process');
    console.log('  status   - Check migration status');
    console.log('\nUsage:');
    console.log('  tsx scripts/migrate-users.ts migrate');
    console.log('  tsx scripts/migrate-users.ts status');
    break;
}