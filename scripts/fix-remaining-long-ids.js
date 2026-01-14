const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read env file manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}

envContent.split('\n').forEach(line => {
  line = line.trim()
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Generate short random ID similar to the Postgres function
function generateShortId(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return result
}

async function fixLongPublicIds() {
  console.log('🔍 Finding lists with long public IDs (UUIDs)...\n')

  // Get all lists
  const { data: allLists, error } = await supabase
    .from('lists')
    .select('id, public_id, title, user_id')

  if (error) {
    console.error('❌ Error fetching lists:', error)
    return
  }

  // Filter lists with long public IDs (UUIDs are 36 chars with dashes)
  const listsWithLongIds = allLists.filter(list =>
    list.public_id && list.public_id.length > 15
  )

  if (listsWithLongIds.length === 0) {
    console.log('✅ All lists already have short public IDs!')
    return
  }

  console.log(`Found ${listsWithLongIds.length} list(s) with long public IDs:\n`)

  for (const list of listsWithLongIds) {
    const oldUrl = `https://snack.xyz/[username]/${list.public_id}`
    console.log(`📋 ${list.title || 'Untitled'}`)
    console.log(`   Current: ${oldUrl}`)
    console.log(`   Length: ${list.public_id.length} characters`)
  }

  console.log('\n🔧 Generating short IDs and updating...\n')

  let successCount = 0
  let errorCount = 0

  for (const list of listsWithLongIds) {
    let newPublicId = generateShortId(8)
    let attempts = 0
    const maxAttempts = 10

    // Check for uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('lists')
        .select('id')
        .eq('public_id', newPublicId)
        .single()

      if (!existing) break // Found unique ID

      newPublicId = generateShortId(attempts === maxAttempts - 1 ? 12 : 8)
      attempts++
    }

    // Update the list
    const { error: updateError } = await supabase
      .from('lists')
      .update({ public_id: newPublicId })
      .eq('id', list.id)

    if (updateError) {
      console.error(`❌ Failed to update "${list.title}":`, updateError.message)
      errorCount++
    } else {
      const newUrl = `https://snack.xyz/[username]/${newPublicId}`
      console.log(`✅ ${list.title || 'Untitled'}`)
      console.log(`   Old: .../${list.public_id.substring(0, 20)}...`)
      console.log(`   New: ${newUrl}`)
      console.log()
      successCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Successfully updated: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)

  if (successCount > 0) {
    console.log('\n🎉 All lists now have short public IDs!')
  }
}

fixLongPublicIds().catch(console.error)
