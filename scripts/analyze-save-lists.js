const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function analyzeSaveLists() {
  console.log('💾 SAVE LISTS TABLE ANALYSIS\n');
  console.log('=' .repeat(60));

  // Check different possible table names for saved lists
  const possibleNames = ['Save Lists', 'save_lists', 'saved_lists', 'bookmarks', 'favorites'];
  
  for (const tableName of possibleNames) {
    console.log(`\n🔍 Checking table: "${tableName}"`);
    try {
      const { data: saveListsData, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(10);

      if (error) {
        console.log(`   ❌ ${error.code}: ${error.message}`);
      } else {
        console.log(`   ✅ FOUND! Table exists with ${count} rows`);
        
        if (saveListsData && saveListsData.length > 0) {
          console.log('\n   🔧 Schema structure:');
          Object.keys(saveListsData[0]).forEach(key => {
            const value = saveListsData[0][key];
            const type = typeof value;
            console.log(`      ${key}: ${type} ${value !== null ? `(sample: "${String(value).slice(0, 30)}${String(value).length > 30 ? '...' : ''}")` : '(null)'}`);
          });
          
          console.log('\n   📊 Data patterns:');
          console.log(`      - Total saved relationships: ${count}`);
          
          // Analyze the relationship pattern
          const userIds = [...new Set(saveListsData.map(item => item.user_id).filter(Boolean))];
          const listIds = [...new Set(saveListsData.map(item => item.list_id).filter(Boolean))];
          
          console.log(`      - Unique users saving lists: ${userIds.length}`);
          console.log(`      - Unique lists being saved: ${listIds.length}`);
          
          // Check for data quality issues
          const duplicates = [];
          const seen = new Set();
          saveListsData.forEach(item => {
            const key = `${item.user_id}-${item.list_id}`;
            if (seen.has(key)) {
              duplicates.push(key);
            }
            seen.add(key);
          });
          
          console.log(`      - Duplicate user-list combinations: ${duplicates.length}`);
          
          // Sample relationships
          console.log('\n   📝 Sample save relationships:');
          saveListsData.slice(0, 5).forEach((item, i) => {
            console.log(`      ${i+1}. User: ${item.user_id} → List: ${item.list_id}`);
            if (item.created_at) console.log(`         Saved on: ${item.created_at}`);
          });
        }
        
        // This is the table we found - break out of loop
        break;
      }
    } catch (e) {
      console.log(`   ❌ Exception: ${e.message}`);
    }
  }

  // Now let's analyze the relationship efficiency
  console.log('\n\n🔬 SAVE LISTS EFFICIENCY ANALYSIS');
  console.log('-'.repeat(40));
  
  try {
    // Check how many users are saving lists vs creating lists
    const { data: listCreators, count: createdListsCount } = await supabase
      .from('lists')
      .select('user_id', { count: 'exact' });
    
    const { data: listSavers, count: savedListsCount } = await supabase
      .from('save_lists')
      .select('user_id', { count: 'exact' });

    if (listCreators && listSavers) {
      const creators = [...new Set(listCreators.map(l => l.user_id))];
      const savers = [...new Set(listSavers.map(s => s.user_id))];
      
      console.log('📊 User behavior patterns:');
      console.log(`   - Users who create lists: ${creators.length}`);
      console.log(`   - Users who save lists: ${savers.length}`);
      console.log(`   - Total created lists: ${createdListsCount}`);
      console.log(`   - Total save relationships: ${savedListsCount}`);
      
      const savesPerCreatedList = savedListsCount / createdListsCount;
      console.log(`   - Average saves per list: ${savesPerCreatedList.toFixed(2)}`);
      
      // Check for power users
      const savesByUser = {};
      listSavers.forEach(save => {
        savesByUser[save.user_id] = (savesByUser[save.user_id] || 0) + 1;
      });
      
      const savesCounts = Object.values(savesByUser);
      const avgSavesPerUser = savesCounts.reduce((a, b) => a + b, 0) / savesCounts.length;
      const maxSavesPerUser = Math.max(...savesCounts);
      
      console.log(`   - Average saves per user: ${avgSavesPerUser.toFixed(2)}`);
      console.log(`   - Max saves by one user: ${maxSavesPerUser}`);
    }

    // Check save patterns by list popularity
    console.log('\n📈 List popularity analysis:');
    const { data: popularLists } = await supabase
      .from('save_lists')
      .select('list_id')
      .neq('list_id', null);
    
    if (popularLists) {
      const popularityCounts = {};
      popularLists.forEach(save => {
        popularityCounts[save.list_id] = (popularityCounts[save.list_id] || 0) + 1;
      });
      
      const sortedLists = Object.entries(popularityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('   Top 5 most saved lists:');
      for (const [listId, saveCount] of sortedLists) {
        // Get list title
        const { data: listInfo } = await supabase
          .from('lists')
          .select('title, emoji')
          .eq('id', listId)
          .single();
        
        if (listInfo) {
          console.log(`      "${listInfo.title}" ${listInfo.emoji} - saved ${saveCount} times`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Save lists efficiency analysis failed:', error);
  }

  console.log('\n\n🎯 OPTIMIZATION RECOMMENDATIONS');
  console.log('-'.repeat(40));
  console.log('Based on usage patterns and scalability needs...');
}

analyzeSaveLists().then(() => {
  console.log('\n✨ Save Lists analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Save Lists analysis failed:', error);
  process.exit(1);
});