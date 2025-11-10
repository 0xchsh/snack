const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
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

  const migrationPath = path.join(__dirname, '../supabase/migrations/014_add_saved_lists.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('Running migration: 014_add_saved_lists.sql')

  try {
    // Use Supabase Management API to run the SQL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1]
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN

    if (!accessToken) {
      console.error('Missing SUPABASE_ACCESS_TOKEN in .env.local')
      process.exit(1)
    }

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Migration failed:', result)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
