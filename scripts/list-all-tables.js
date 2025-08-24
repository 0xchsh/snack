const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
  console.log('📋 LISTING ALL TABLES IN DATABASE\n');

  // Try to get table list using information_schema
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name, table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log('Cannot use exec_sql, trying alternative method...');
      
      // Alternative: try to access each expected table
      const tableChecks = ['users', 'lists', 'items', 'links', 'profiles'];
      
      for (const tableName of tableChecks) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*', { head: true, count: 'exact' });
          
          if (error) {
            if (error.code === '42P01') {
              console.log(`❌ ${tableName} - does not exist`);
            } else {
              console.log(`⚠️  ${tableName} - error: ${error.message}`);
            }
          } else {
            console.log(`✅ ${tableName} - exists (${data?.length || 0} rows)`);
          }
        } catch (e) {
          console.log(`❌ ${tableName} - access error`);
        }
      }
    } else {
      console.log('✅ Available tables:');
      data.forEach(table => {
        console.log(`   - ${table.table_name} (${table.table_type})`);
      });
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listAllTables().then(() => {
  console.log('\n✨ Table listing complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Table listing failed:', error);
  process.exit(1);
});