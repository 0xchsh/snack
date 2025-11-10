const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkSaveCounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('Checking save_count column...\n')

  // Check if save_count column exists
  const { data: lists } = await supabase
    .from('lists')
    .select('id, title, save_count')
    .limit(10)

  console.log('Sample lists:')
  lists.forEach(list => {
    console.log(`  - "${list.title || 'Untitled'}": save_count = ${list.save_count ?? 'NULL'}`)
  })

  // Check if there are any NULL values
  const nullCount = lists.filter(l => l.save_count === null).length
  if (nullCount > 0) {
    console.log(`\n⚠️  Found ${nullCount} lists with NULL save_count`)
    console.log('This needs to be fixed!')
  } else {
    console.log('\n✅ All lists have save_count defined')
  }
}

checkSaveCounts()
