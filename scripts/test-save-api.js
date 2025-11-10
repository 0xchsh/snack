const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSaveAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('Testing save/unsave API...\n')

  // Get a test list
  const { data: testList } = await supabase
    .from('lists')
    .select('id, title, save_count')
    .eq('is_public', true)
    .limit(1)
    .single()

  console.log(`Test list: "${testList.title}"`)
  console.log(`Initial save_count: ${testList.save_count}\n`)

  // Get test user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const testUser = users[0]

  console.log(`Test user: ${testUser.email}\n`)

  // Delete any existing save first
  await supabase
    .from('saved_lists')
    .delete()
    .eq('user_id', testUser.id)
    .eq('list_id', testList.id)

  console.log('1. Making POST request to save...')

  // Simulate the API call
  const { data: saveResult, error: saveError } = await supabase
    .from('saved_lists')
    .insert({
      user_id: testUser.id,
      list_id: testList.id
    })
    .select()
    .single()

  if (saveError) {
    console.error('Save error:', saveError)
    process.exit(1)
  }

  console.log('2. Save successful, waiting 100ms...')
  await new Promise(resolve => setTimeout(resolve, 100))

  const { data: updatedList } = await supabase
    .from('lists')
    .select('save_count')
    .eq('id', testList.id)
    .single()

  console.log(`3. Fetched save_count: ${updatedList.save_count}`)
  console.log(`\nAPI should return: { success: true, data: { ...savedList, save_count: ${updatedList.save_count} } }`)

  // Cleanup
  await supabase
    .from('saved_lists')
    .delete()
    .eq('id', saveResult.id)
}

testSaveAPI()
