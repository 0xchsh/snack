const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPublicIds() {
  console.log('Checking public_id values in lists table...\n')

  const { data: lists, error } = await supabase
    .from('lists')
    .select('id, public_id, title, users(username)')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching lists:', error)
    return
  }

  console.log(`Found ${lists.length} lists:\n`)

  lists.forEach(list => {
    const username = list.users?.username || 'unknown'
    const publicId = list.public_id || 'NULL'
    const publicIdLength = publicId === 'NULL' ? 0 : publicId.length
    const url = `https://app.snack.xyz/${username}/${publicId}`

    console.log(`Title: ${list.title || 'Untitled'}`)
    console.log(`  ID: ${list.id}`)
    console.log(`  Public ID: ${publicId} (${publicIdLength} chars)`)
    console.log(`  URL: ${url}`)
    console.log()
  })

  // Check if any lists have NULL public_id
  const nullCount = lists.filter(l => !l.public_id).length
  if (nullCount > 0) {
    console.log(`⚠️  ${nullCount} lists have NULL public_id values`)
    console.log('Run the migration or manually update them')
  } else {
    console.log('✅ All lists have public_id values set')
  }
}

checkPublicIds()
