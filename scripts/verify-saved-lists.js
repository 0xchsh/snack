const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function verifySavedLists() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('Checking saved_lists table...\n')

  try {
    // Try to query the saved_lists table
    const { data, error } = await supabase
      .from('saved_lists')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error querying saved_lists table:', error.message)
      console.log('\nThe table might not exist or there might be permission issues.')
      process.exit(1)
    }

    console.log('✅ saved_lists table exists and is accessible!')
    console.log(`   Found ${data.length} sample record(s)`)

    // Check if we can also query with joined data
    const { data: listsData, error: listsError } = await supabase
      .from('lists')
      .select('id, save_count')
      .limit(5)

    if (!listsError) {
      console.log('\n✅ Lists table has save_count column!')
      console.log('   Sample save_counts:', listsData.map(l => `${l.id.substring(0,8)}: ${l.save_count || 0}`).join(', '))
    }

    console.log('\n✅ Migration appears to be working correctly!')
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

verifySavedLists()
