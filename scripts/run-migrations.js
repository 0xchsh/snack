#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filePath, migrationName) {
  try {
    console.log(`\n📋 Running migration: ${migrationName}`);
    console.log('Reading SQL file...');
    
    const sql = await fs.readFile(filePath, 'utf8');
    
    console.log('Executing SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
    
    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('Trying alternative execution method...');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { data, error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (stmtError) {
            console.error(`Error in statement: ${stmtError.message}`);
            throw stmtError;
          }
        }
      }
    }
    
    console.log(`✅ Migration ${migrationName} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migrationName} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  
  const migrations = [
    {
      file: 'supabase/migrations/012_add_analytics_tracking.sql',
      name: 'Analytics Tracking'
    },
    {
      file: 'supabase/migrations/013_replace_public_ids_with_short_ids.sql',
      name: 'Short Public IDs'
    }
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const filePath = path.join(process.cwd(), migration.file);
    const success = await runMigration(filePath, migration.name);
    if (!success) {
      allSuccess = false;
      console.log('\n⚠️  Stopping migrations due to error');
      break;
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test analytics tracking on public list views');
    console.log('2. Verify shorter URLs are working');
    console.log('3. Check backward compatibility with old UUID URLs');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
  }
}

main().catch(console.error);