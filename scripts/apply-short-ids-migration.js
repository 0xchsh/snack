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
  console.error('Missing Supabase credentials in .env.local')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyShortIdsMigration() {
  console.log('🚀 Starting short IDs migration...\n')

  // First, check current state
  console.log('📊 Checking current state...')
  const { data: sampleLists, error: checkError } = await supabase
    .from('lists')
    .select('id, public_id, title')
    .limit(5)

  if (checkError) {
    console.error('❌ Error checking lists:', checkError)
    return
  }

  console.log(`Found ${sampleLists.length} sample lists:`)
  sampleLists.forEach(list => {
    const publicIdInfo = list.public_id ?
      `${list.public_id} (${list.public_id.length} chars)` :
      'NULL'
    console.log(`  - ${list.title || 'Untitled'}: public_id = ${publicIdInfo}`)
  })
  console.log()

  const hasNullPublicIds = sampleLists.some(l => !l.public_id)
  const hasLongPublicIds = sampleLists.some(l => l.public_id && l.public_id.length > 15)

  if (!hasNullPublicIds && !hasLongPublicIds) {
    console.log('✅ All lists already have short public IDs!')
    console.log('No migration needed.')
    return
  }

  // Read and execute the migration SQL
  console.log('📝 Reading migration file...')
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '013_replace_public_ids_with_short_ids.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    return
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
  console.log('✅ Migration file loaded\n')

  console.log('⚠️  This migration will:')
  console.log('   1. Drop the existing public_id column')
  console.log('   2. Create a new public_id column (TEXT)')
  console.log('   3. Generate short 8-character IDs for all existing lists')
  console.log('   4. Add triggers to auto-generate IDs for new lists\n')

  console.log('🔧 Applying migration...')

  // Execute the migration via RPC or direct SQL
  // Note: Supabase JS client doesn't support raw SQL execution directly
  // We need to use the REST API or postgres connection

  console.log('\n⚠️  To apply this migration, run:')
  console.log('\n   npx supabase db push --db-url "your-connection-string"')
  console.log('\nOr execute the SQL manually in Supabase dashboard:\n')
  console.log(`   ${migrationPath}\n`)

  console.log('Alternatively, you can run this migration using the Supabase CLI:')
  console.log('   1. Make sure migration 013 is in supabase/migrations/')
  console.log('   2. Run: npx supabase db push\n')
}

applyShortIdsMigration().catch(console.error)
