#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('📋 Preparing migrations for Supabase Dashboard SQL Editor\n');
  
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
  
  let combinedSql = '';
  
  for (const migration of migrations) {
    const filePath = path.join(process.cwd(), migration.file);
    const sql = await fs.readFile(filePath, 'utf8');
    
    combinedSql += `-- ===================================\n`;
    combinedSql += `-- Migration: ${migration.name}\n`;
    combinedSql += `-- File: ${migration.file}\n`;
    combinedSql += `-- ===================================\n\n`;
    combinedSql += sql;
    combinedSql += '\n\n';
    
    console.log(`✅ Prepared: ${migration.name}`);
  }
  
  // Save combined SQL
  const outputPath = path.join(process.cwd(), 'combined-migrations.sql');
  await fs.writeFile(outputPath, combinedSql);
  
  console.log('\n📄 Combined migrations saved to: combined-migrations.sql');
  console.log('\n📌 Instructions to run migrations:');
  console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project (fwahxwlbsilzlbgeotyk)');
  console.log('3. Navigate to SQL Editor (left sidebar)');
  console.log('4. Create a new query');
  console.log('5. Copy and paste the contents of combined-migrations.sql');
  console.log('6. Click "Run" to execute the migrations');
  console.log('\n⚠️  IMPORTANT: Review the SQL before running to ensure it\'s safe for your production database!');
}

main().catch(console.error);