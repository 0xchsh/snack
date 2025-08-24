const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItemsTable() {
  console.log('🔍 Checking items table (links)...\n');

  try {
    // Check items table schema
    console.log('🔗 Items table schema:');
    const { data: sampleItems, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      console.error('   Error:', itemsError.message);
      console.error('   Code:', itemsError.code);
    } else if (sampleItems && sampleItems.length > 0) {
      console.log('   Columns found:', Object.keys(sampleItems[0]));
      console.log('   Sample data:', sampleItems[0]);
    } else {
      console.log('   Table exists but no data found');
    }

    // Get count
    const { count, error: countError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log('   Total items:', count);
    }

  } catch (error) {
    console.error('Error checking items table:', error);
  }
}

checkItemsTable().then(() => {
  console.log('\n✨ Items table check complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Items table check failed:', error);
  process.exit(1);
});