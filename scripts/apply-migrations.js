#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
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

async function checkTablesExist() {
  console.log('\n📊 Checking existing tables...');
  
  // Check for analytics tables
  const { data: viewsTable } = await supabase
    .from('list_views')
    .select('id')
    .limit(1);
    
  const { data: clicksTable } = await supabase
    .from('link_clicks')
    .select('id')
    .limit(1);
    
  // Check for public_id column
  const { data: lists } = await supabase
    .from('lists')
    .select('id, public_id')
    .limit(1);
  
  const hasAnalyticsTables = viewsTable !== null || clicksTable !== null;
  const hasPublicId = lists && lists[0] && 'public_id' in lists[0];
  
  console.log(`- Analytics tables (list_views, link_clicks): ${hasAnalyticsTables ? '✅ Exist' : '❌ Not found'}`);
  console.log(`- Short IDs (public_id column): ${hasPublicId ? '✅ Exists' : '❌ Not found'}`);
  
  return { hasAnalyticsTables, hasPublicId };
}

async function testAnalytics() {
  console.log('\n🧪 Testing analytics functionality...');
  
  try {
    // Test inserting a view record
    const { data: testView, error: viewError } = await supabase
      .from('list_views')
      .insert({
        list_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        viewer_ip: '127.0.0.1',
        viewer_user_agent: 'Test Script',
        referrer: 'test'
      })
      .select()
      .single();
    
    if (viewError && !viewError.message.includes('violates foreign key')) {
      console.log('❌ Analytics tables not properly set up:', viewError.message);
      return false;
    }
    
    console.log('✅ Analytics tables are working (tested with dummy insert)');
    
    // Clean up test record if it was created
    if (testView) {
      await supabase.from('list_views').delete().eq('id', testView.id);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Analytics test failed:', error.message);
    return false;
  }
}

async function testShortIds() {
  console.log('\n🔤 Testing short IDs functionality...');
  
  try {
    // Check if any lists have short IDs
    const { data: lists, error } = await supabase
      .from('lists')
      .select('id, public_id, title')
      .limit(5);
    
    if (error) {
      console.log('❌ Error fetching lists:', error.message);
      return false;
    }
    
    if (!lists || lists.length === 0) {
      console.log('⚠️  No lists found to test');
      return true;
    }
    
    const hasShortIds = lists.every(list => 
      list.public_id && 
      list.public_id.length <= 12 && 
      list.public_id.length >= 8
    );
    
    if (hasShortIds) {
      console.log('✅ Short IDs are working');
      console.log('Sample short IDs:');
      lists.slice(0, 3).forEach(list => {
        console.log(`  - ${list.title}: ${list.public_id}`);
      });
    } else {
      console.log('❌ Short IDs not properly configured');
      console.log('Current public_id values:');
      lists.slice(0, 3).forEach(list => {
        console.log(`  - ${list.title}: ${list.public_id || 'NULL'}`);
      });
    }
    
    return hasShortIds;
  } catch (error) {
    console.log('❌ Short IDs test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Checking migration status...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  // Check current state
  const { hasAnalyticsTables, hasPublicId } = await checkTablesExist();
  
  if (!hasAnalyticsTables && !hasPublicId) {
    console.log('\n⚠️  Migrations have not been applied yet!');
    console.log('\n📋 To apply migrations:');
    console.log('1. Open combined-migrations.sql');
    console.log('2. Copy the SQL content');
    console.log('3. Go to: https://supabase.com/dashboard/project/fwahxwlbsilzlbgeotyk/sql/new');
    console.log('4. Paste and run the SQL');
    console.log('5. Run this script again to verify');
  } else {
    console.log('\n✨ Testing migration features...');
    
    if (hasAnalyticsTables) {
      await testAnalytics();
    }
    
    if (hasPublicId) {
      await testShortIds();
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Analytics: ${hasAnalyticsTables ? '✅ Applied' : '❌ Not applied'}`);
    console.log(`- Short IDs: ${hasPublicId ? '✅ Applied' : '❌ Not applied'}`);
  }
}

main().catch(console.error);