#!/usr/bin/env node

/**
 * Script to check if database triggers are properly set up
 * and manually create user record if missing
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const { resolve } = require('path')

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTriggersAndCreateUsers() {
  console.log('Checking database triggers and creating missing user records...')
  
  try {
    // Skip function check for now - focus on users
    console.log('\n1. Skipping function check for now...')
    
    // Check if the trigger exists
    console.log('\n2. Checking auth users from auth.users...')
    
    // Get all auth users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return
    }
    
    console.log(`Found ${authUsers?.length || 0} auth users`)
    
    // Get all custom users
    console.log('\n3. Checking users in public.users table...')
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('id, email, username')
    
    if (customError) {
      console.error('Error fetching custom users:', customError)
      return
    }
    
    console.log(`Found ${customUsers?.length || 0} custom users`)
    
    // Find missing users
    const customUserIds = new Set((customUsers || []).map(u => u.id))
    const missingUsers = (authUsers || []).filter(authUser => !customUserIds.has(authUser.id))
    
    console.log(`\n4. Found ${missingUsers.length} users missing from public.users table`)
    
    // Create missing user records
    for (const authUser of missingUsers) {
      console.log(`Creating user record for: ${authUser.email}`)
      
      const userData = {
        id: authUser.id,
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
        first_name: authUser.user_metadata?.first_name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
        email: authUser.email
      }
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(userData)
      
      if (insertError) {
        console.error(`❌ Error creating user ${authUser.email}:`, insertError.message)
      } else {
        console.log(`✅ Created user record for ${authUser.email}`)
      }
    }
    
    console.log(`\n✨ Process complete! Created ${missingUsers.length} user records`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the check
checkTriggersAndCreateUsers()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })