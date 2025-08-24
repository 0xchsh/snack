const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function checkWithAnonKey() {
  console.log('🔍 CHECKING DATABASE WITH ANON KEY\n');
  console.log('URL:', supabaseUrl);
  console.log('Key type: Anonymous/Public Key\n');

  const tables = ['users', 'lists', 'items'];
  
  for (const tableName of tables) {
    console.log(`📋 Checking ${tableName} table:`);
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.error(`   ❌ Error: ${error.message} (${error.code})`);
      } else {
        console.log(`   ✅ Accessible - ${count} total rows`);
        if (data && data.length > 0) {
          console.log(`   📊 Sample data columns:`, Object.keys(data[0]));
          console.log(`   🔍 First record:`, data[0]);
        }
      }
    } catch (e) {
      console.error(`   ❌ Exception:`, e.message);
    }
    console.log('');
  }
}

checkWithAnonKey().then(() => {
  console.log('✨ Anon key check complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Anon key check failed:', error);
  process.exit(1);
});