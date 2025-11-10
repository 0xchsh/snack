const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSaveTrigger() {
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

  console.log('Testing save_count trigger...\n')

  try {
    // Pick a random public list
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id, title, save_count')
      .eq('is_public', true)
      .limit(1)
      .single()

    if (listsError || !lists) {
      console.error('Error fetching test list:', listsError)
      process.exit(1)
    }

    console.log(`Test list: "${lists.title}"`)
    console.log(`Current save_count: ${lists.save_count || 0}`)

    // Get a test user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError || !users || users.length === 0) {
      console.error('Error fetching test user:', usersError)
      process.exit(1)
    }

    const testUser = users[0]
    console.log(`\nUsing test user: ${testUser.email}\n`)

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_lists')
      .select('id')
      .eq('user_id', testUser.id)
      .eq('list_id', lists.id)
      .single()

    if (existingSave) {
      console.log('This list is already saved by this user. Removing first...')
      await supabase
        .from('saved_lists')
        .delete()
        .eq('id', existingSave.id)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Get current save_count
    const { data: beforeList } = await supabase
      .from('lists')
      .select('save_count')
      .eq('id', lists.id)
      .single()

    console.log(`\n1. Before save - save_count: ${beforeList.save_count || 0}`)

    // Save the list
    const { error: saveError } = await supabase
      .from('saved_lists')
      .insert({
        user_id: testUser.id,
        list_id: lists.id
      })

    if (saveError) {
      console.error('Error saving list:', saveError)
      process.exit(1)
    }

    console.log('2. Inserted save record')

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get updated save_count
    const { data: afterSaveList } = await supabase
      .from('lists')
      .select('save_count')
      .eq('id', lists.id)
      .single()

    console.log(`3. After save - save_count: ${afterSaveList.save_count || 0}`)

    const saveIncremented = (afterSaveList.save_count || 0) > (beforeList.save_count || 0)
    console.log(`\n✅ Save count incremented: ${saveIncremented ? 'YES' : 'NO'}`)

    // Unsave the list
    const { error: unsaveError } = await supabase
      .from('saved_lists')
      .delete()
      .eq('user_id', testUser.id)
      .eq('list_id', lists.id)

    if (unsaveError) {
      console.error('Error unsaving list:', unsaveError)
      process.exit(1)
    }

    console.log('\n4. Deleted save record')

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get final save_count
    const { data: afterUnsaveList } = await supabase
      .from('lists')
      .select('save_count')
      .eq('id', lists.id)
      .single()

    console.log(`5. After unsave - save_count: ${afterUnsaveList.save_count || 0}`)

    const saveDecremented = (afterUnsaveList.save_count || 0) < (afterSaveList.save_count || 0)
    console.log(`\n✅ Save count decremented: ${saveDecremented ? 'YES' : 'NO'}`)

    if (saveIncremented && saveDecremented) {
      console.log('\n✅ Trigger is working correctly!')
    } else {
      console.log('\n❌ Trigger is NOT working correctly!')
    }

  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testSaveTrigger()
