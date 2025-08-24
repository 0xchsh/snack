const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseSchema() {
  console.log('🔍 Checking Supabase database...\n');
  console.log('URL:', supabaseUrl);
  console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key');
  console.log('\n-------------------\n');

  try {
    // Check users table
    console.log('📋 Checking users table...');
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false })
      .limit(3);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      console.error('   Error code:', usersError.code);
      console.error('   Details:', JSON.stringify(usersError, null, 2));
    } else {
      console.log('✅ Users table exists');
      console.log(`   Total users: ${usersCount}`);
      if (users && users.length > 0) {
        console.log('   Sample users:');
        users.forEach(user => {
          console.log(`     - ${user.email} (${user.username || 'no username'})`);
        });
      }
    }

    console.log('\n-------------------\n');

    // Check lists table
    console.log('📋 Checking lists table...');
    const { data: lists, error: listsError, count: listsCount } = await supabase
      .from('lists')
      .select('*', { count: 'exact', head: false })
      .limit(3);

    if (listsError) {
      console.error('❌ Lists table error:', listsError.message);
      console.error('   Error code:', listsError.code);
      console.error('   Details:', JSON.stringify(listsError, null, 2));
    } else {
      console.log('✅ Lists table exists');
      console.log(`   Total lists: ${listsCount}`);
      if (lists && lists.length > 0) {
        console.log('   Sample lists:');
        lists.forEach(list => {
          console.log(`     - ${list.title} (${list.emoji || 'no emoji'})`);
        });
      }
    }

    console.log('\n-------------------\n');

    // Check links table
    console.log('📋 Checking links table...');
    const { data: links, error: linksError, count: linksCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: false })
      .limit(3);

    if (linksError) {
      console.error('❌ Links table error:', linksError.message);
      console.error('   Error code:', linksError.code);
      console.error('   Details:', JSON.stringify(linksError, null, 2));
    } else {
      console.log('✅ Links table exists');
      console.log(`   Total links: ${linksCount}`);
      if (links && links.length > 0) {
        console.log('   Sample links:');
        links.forEach(link => {
          console.log(`     - ${link.title || link.url}`);
        });
      }
    }

    console.log('\n-------------------\n');

    // Test auth user
    console.log('🔐 Testing auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (using anon key or service role)');
    } else if (user) {
      console.log('✅ Authenticated as:', user.email);
    }

    console.log('\n-------------------\n');

    // Check if we can create a test user
    console.log('🧪 Testing user creation...');
    const testUserId = 'test-' + Date.now();
    const { data: testUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-' + testUserId.slice(-12),
        email: `test-${Date.now()}@example.com`,
        username: `test_user_${Date.now()}`
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Cannot create test user:', createError.message);
      console.error('   Error code:', createError.code);
      console.error('   Details:', JSON.stringify(createError, null, 2));
      
      if (createError.message?.includes('violates foreign key constraint')) {
        console.log('\n⚠️  The users table has a foreign key constraint to auth.users');
        console.log('   This means users can only be created after authentication');
      }
    } else {
      console.log('✅ Test user created successfully');
      // Clean up test user
      await supabase.from('users').delete().eq('id', testUser.id);
      console.log('   Test user cleaned up');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSupabaseSchema().then(() => {
  console.log('\n✨ Check complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});