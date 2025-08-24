const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualSchema() {
  console.log('🔍 Checking actual table schemas...\n');

  try {
    // Get actual users table schema
    console.log('👤 Users table schema:');
    const { data: usersSchema, error: usersSchemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'users' });
    
    if (usersSchemaError) {
      console.log('   Using fallback method...');
      // Fallback: get a few users to see the actual columns
      const { data: sampleUsers, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('   Error:', error.message);
      } else if (sampleUsers && sampleUsers.length > 0) {
        console.log('   Columns found:', Object.keys(sampleUsers[0]));
        console.log('   Sample data:', sampleUsers[0]);
      }
    } else {
      console.log('   Schema:', usersSchema);
    }

    console.log('\n📋 Lists table schema:');
    const { data: sampleLists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .limit(1);
    
    if (listsError) {
      console.error('   Error:', listsError.message);
    } else if (sampleLists && sampleLists.length > 0) {
      console.log('   Columns found:', Object.keys(sampleLists[0]));
      console.log('   Sample data:', sampleLists[0]);
    }

    console.log('\n🔗 Links table check:');
    const { data: sampleLinks, error: linksError } = await supabase
      .from('links')
      .select('*')
      .limit(1);
    
    if (linksError) {
      console.error('   Error:', linksError.message);
      console.error('   Code:', linksError.code);
    } else if (sampleLinks) {
      console.log('   Links table exists with columns:', Object.keys(sampleLinks[0] || {}));
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkActualSchema().then(() => {
  console.log('\n✨ Schema check complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Schema check failed:', error);
  process.exit(1);
});