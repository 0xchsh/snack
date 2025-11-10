const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function debugSpecificList() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const listId = 'eee0e75d-305e-4d84-96f1-74683d5f7f91'

  console.log(`\nDebugging list: ${listId}\n`)

  // 1. Check if list exists
  const { data: lists, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)

  console.log(`1. Lists found with this ID: ${lists?.length || 0}`)
  if (lists && lists.length > 0) {
    console.log(`   save_count: ${lists[0].save_count}`)
    console.log(`   title: ${lists[0].title}`)
  }

  // 2. Check saved_lists records
  const { data: saves } = await supabase
    .from('saved_lists')
    .select('*')
    .eq('list_id', listId)

  console.log(`\n2. Saved records for this list: ${saves?.length || 0}`)
  if (saves && saves.length > 0) {
    saves.forEach((save, i) => {
      console.log(`   Save #${i+1}: user_id=${save.user_id}, saved_at=${save.saved_at}`)
    })
  }

  // 3. Check if trigger exists
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1]

  const checkTriggerQuery = `
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'saved_lists'
      AND trigger_name = 'trigger_update_save_count';
  `

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: checkTriggerQuery })
    }
  )

  const triggerResult = await response.json()

  console.log(`\n3. Trigger exists: ${triggerResult.length > 0 ? 'YES' : 'NO'}`)
  if (triggerResult.length > 0) {
    console.log(`   Events: ${triggerResult.map(t => t.event_manipulation).join(', ')}`)
  }

  console.log(`\n4. Expected save_count: ${saves?.length || 0}`)
  console.log(`   Actual save_count: ${lists?.[0]?.save_count || 0}`)
  console.log(`   Match: ${(saves?.length || 0) === (lists?.[0]?.save_count || 0) ? 'YES' : 'NO'}`)
}

debugSpecificList()
