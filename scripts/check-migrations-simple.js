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

async function checkFeatures() {
  console.log('🔍 Checking database features...\n')

  const checks = [
    { name: 'users table', test: async () => {
      const { error } = await supabase.from('users').select('id').limit(1)
      return !error
    }},
    { name: 'lists table', test: async () => {
      const { error } = await supabase.from('lists').select('id').limit(1)
      return !error
    }},
    { name: 'links table', test: async () => {
      const { error } = await supabase.from('links').select('id').limit(1)
      return !error
    }},
    { name: 'saved_lists table', test: async () => {
      const { error } = await supabase.from('saved_lists').select('id').limit(1)
      return !error
    }},
    { name: 'analytics_events table', test: async () => {
      const { error } = await supabase.from('analytics_events').select('id').limit(1)
      return !error
    }},
    { name: 'profile_visibility in users', test: async () => {
      const { error } = await supabase.from('users').select('profile_visibility').limit(1)
      return !error
    }},
    { name: 'save_count in lists', test: async () => {
      const { error } = await supabase.from('lists').select('save_count').limit(1)
      return !error
    }},
    { name: 'view_count in lists', test: async () => {
      const { error } = await supabase.from('lists').select('view_count').limit(1)
      return !error
    }},
    { name: 'username constraints', test: async () => {
      const { data } = await supabase.from('users').select('username').limit(1)
      return data && data.length > 0
    }},
    { name: 'public_id in lists (short IDs)', test: async () => {
      const { data } = await supabase.from('lists').select('public_id').limit(1)
      return data && data.length > 0 && data[0].public_id && data[0].public_id.length <= 12
    }}
  ]

  console.log('Feature Status:\n')

  const results = []
  for (const check of checks) {
    try {
      const result = await check.test()
      results.push({ name: check.name, status: result })
      console.log(`   ${result ? '✅' : '❌'} ${check.name}`)
    } catch (error) {
      results.push({ name: check.name, status: false })
      console.log(`   ❌ ${check.name}`)
    }
  }

  console.log('\n\n📋 Migration Files:\n')
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  migrationFiles.forEach(file => {
    console.log(`   📄 ${file}`)
  })

  console.log('\n\n💡 Analysis:\n')

  const missingFeatures = results.filter(r => !r.status)

  if (missingFeatures.length === 0) {
    console.log('   ✨ All expected features are present!')
  } else {
    console.log(`   ⚠️  ${missingFeatures.length} feature(s) may be missing:\n`)
    missingFeatures.forEach(f => console.log(`      - ${f.name}`))

    console.log('\n   Potential migrations needed:')
    if (missingFeatures.some(f => f.name === 'analytics_events table')) {
      console.log('      📌 012_add_analytics_tracking.sql - for analytics_events')
    }
    if (missingFeatures.some(f => f.name === 'profile_visibility in users')) {
      console.log('      📌 008_add_profile_visibility.sql - for profile visibility')
    }
    if (missingFeatures.some(f => f.name === 'saved_lists table')) {
      console.log('      📌 014_add_saved_lists.sql - for saved lists')
      console.log('      📌 015_fix_save_count_trigger.sql - for save count trigger')
    }
  }

  console.log('\n   ✅ Features already working:')
  results.filter(r => r.status).forEach(f => console.log(`      - ${f.name}`))
}

checkFeatures().catch(console.error)
