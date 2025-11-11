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

async function checkMigrations() {
  console.log('🔍 Checking migration status...\n')

  // List all migration files
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`📁 Found ${migrationFiles.length} migration files:\n`)

  // Check for supabase_migrations table
  const { data: tablesData, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'supabase_migrations')

  let appliedMigrations = []

  if (tablesError || !tablesData || tablesData.length === 0) {
    console.log('⚠️  No supabase_migrations tracking table found.')
    console.log('   Checking tables manually...\n')

    // Check which features exist in the database
    const checks = {
      'users table': 'users',
      'lists table': 'lists',
      'links table': 'links',
      'saved_lists table': 'saved_lists',
      'analytics_events table': 'analytics_events'
    }

    console.log('✅ Database Tables:\n')
    for (const [name, table] of Object.entries(checks)) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (!error) {
        console.log(`   ✓ ${name}`)
      } else {
        console.log(`   ✗ ${name} - ${error.message}`)
      }
    }

    console.log('\n📋 Checking specific features:\n')

    // Check for profile_visibility in users table
    const { error: profileVisError } = await supabase
      .from('users')
      .select('profile_visibility')
      .limit(1)
    console.log(`   ${profileVisError ? '✗' : '✓'} profile_visibility column in users`)

    // Check for public_id type (should be text for short IDs)
    const { data: columnsData } = await supabase.rpc('exec_sql', {
      sql: "SELECT data_type FROM information_schema.columns WHERE table_name='lists' AND column_name='public_id'"
    }).catch(() => ({ data: null }))

    if (columnsData) {
      console.log(`   ✓ public_id column type: ${columnsData}`)
    }

    // Check for save_count in lists
    const { error: saveCountError } = await supabase
      .from('lists')
      .select('save_count')
      .limit(1)
    console.log(`   ${saveCountError ? '✗' : '✓'} save_count column in lists`)

  } else {
    // Read applied migrations from tracking table
    const { data: migrations, error: migrationsError } = await supabase
      .from('supabase_migrations')
      .select('*')
      .order('version')

    if (migrationsError) {
      console.error('❌ Error reading migrations:', migrationsError)
      return
    }

    appliedMigrations = migrations.map(m => m.version)
    console.log(`✅ ${migrations.length} migrations applied:\n`)
    migrations.forEach(m => {
      console.log(`   ${m.version} - ${m.name || 'unnamed'}`)
    })
  }

  console.log('\n\n📋 Migration Files:\n')
  migrationFiles.forEach(file => {
    const version = file.split('_')[0]
    const isApplied = appliedMigrations.includes(version)
    const status = isApplied ? '✅' : '⚠️ '
    console.log(`   ${status} ${file}`)
  })

  console.log('\n💡 Recommendations:\n')

  const unapplied = migrationFiles.filter(f => {
    const version = f.split('_')[0]
    return !appliedMigrations.includes(version)
  })

  if (unapplied.length === 0) {
    console.log('   All migrations appear to be applied! ✨')
  } else {
    console.log(`   ${unapplied.length} migration(s) may need to be applied:`)
    unapplied.forEach(f => console.log(`   - ${f}`))
    console.log('\n   To apply migrations, you can:')
    console.log('   1. Use Supabase CLI: npx supabase db push')
    console.log('   2. Run SQL manually in Supabase dashboard')
    console.log('   3. Use the migration scripts in the scripts/ folder')
  }
}

checkMigrations().catch(console.error)
