const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkLinksTable() {
  console.log('🔗 CHECKING LINKS TABLE WITH SERVICE ROLE\n');

  try {
    console.log('📊 Getting links table data...');
    const { data: links, error, count } = await supabase
      .from('links')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error(`❌ Links table error: ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Links table exists with ${count} total rows`);
      
      if (links && links.length > 0) {
        console.log('\n🔧 Links table schema:');
        const sample = links[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          console.log(`   ${key}: ${type} ${value !== null ? `(sample: "${String(value).slice(0, 50)}${String(value).length > 50 ? '...' : ''}")` : '(null)'}`);
        });
        
        console.log('\n📝 ID patterns in links:');
        links.slice(0, 3).forEach((link, i) => {
          console.log(`   Link ${i+1}: ${link.id} (length: ${link.id?.length})`);
        });
        
        console.log('\n🔍 Data quality:');
        const hasUrl = links.filter(l => l.url).length;
        const hasTitle = links.filter(l => l.title).length;
        const hasImageUrl = links.filter(l => l.image_url).length;
        const hasFaviconUrl = links.filter(l => l.favicon_url).length;
        console.log(`   - Links with URL: ${hasUrl}/${links.length}`);
        console.log(`   - Links with title: ${hasTitle}/${links.length}`);
        console.log(`   - Links with image_url: ${hasImageUrl}/${links.length}`);
        console.log(`   - Links with favicon_url: ${hasFaviconUrl}/${links.length}`);
      }
    }
  } catch (error) {
    console.error('Error checking links table:', error);
  }
}

checkLinksTable().then(() => {
  console.log('\n✨ Links table check complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Links table check failed:', error);
  process.exit(1);
});