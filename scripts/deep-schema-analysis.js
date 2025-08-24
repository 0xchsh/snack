const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepSchemaAnalysis() {
  console.log('🔬 DEEP SCHEMA ANALYSIS\n');
  console.log('=' .repeat(50));

  // Analyze Users Table
  console.log('\n👤 USERS TABLE ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (usersError) {
      console.error('❌ Users error:', usersError);
    } else {
      console.log(`📊 Sample size: ${users.length} users`);
      console.log('🔧 Schema structure:');
      if (users.length > 0) {
        const sample = users[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          const length = value ? value.toString().length : 0;
          console.log(`   ${key}: ${type} (${value ? 'sample length: ' + length : 'null'})`);
        });
        
        console.log('\n📝 ID patterns:');
        users.forEach((user, i) => {
          console.log(`   User ${i+1}: ${user.id} (length: ${user.id?.length})`);
        });
        
        console.log('\n🔍 Data quality:');
        const hasClerkId = users.filter(u => u.clerk_id).length;
        const hasUsername = users.filter(u => u.username).length;
        const hasFirstName = users.filter(u => u.first_name).length;
        console.log(`   - Users with clerk_id: ${hasClerkId}/${users.length}`);
        console.log(`   - Users with username: ${hasUsername}/${users.length}`);
        console.log(`   - Users with first_name: ${hasFirstName}/${users.length}`);
      }
    }
  } catch (error) {
    console.error('Failed to analyze users:', error);
  }

  // Analyze Lists Table
  console.log('\n\n📋 LISTS TABLE ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .limit(10);

    if (listsError) {
      console.error('❌ Lists error:', listsError);
    } else {
      console.log(`📊 Sample size: ${lists.length} lists`);
      console.log('🔧 Schema structure:');
      if (lists.length > 0) {
        const sample = lists[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          const length = value ? value.toString().length : 0;
          console.log(`   ${key}: ${type} (${value ? 'sample length: ' + length : 'null'})`);
        });
        
        console.log('\n📝 ID patterns:');
        lists.slice(0, 5).forEach((list, i) => {
          console.log(`   List ${i+1}: ${list.id} (length: ${list.id?.length})`);
          if (list.public_id) {
            console.log(`     Public ID: ${list.public_id} (length: ${list.public_id?.length})`);
          }
        });
        
        console.log('\n🔍 Data quality:');
        const hasPublicId = lists.filter(l => l.public_id).length;
        const hasEmoji = lists.filter(l => l.emoji).length;
        const hasDescription = lists.filter(l => l.description).length;
        const isPublic = lists.filter(l => l.is_public).length;
        console.log(`   - Lists with public_id: ${hasPublicId}/${lists.length}`);
        console.log(`   - Lists with emoji: ${hasEmoji}/${lists.length}`);
        console.log(`   - Lists with description: ${hasDescription}/${lists.length}`);
        console.log(`   - Public lists: ${isPublic}/${lists.length}`);
        
        console.log('\n📈 Usage patterns:');
        const viewModes = {};
        lists.forEach(list => {
          viewModes[list.view_mode] = (viewModes[list.view_mode] || 0) + 1;
        });
        console.log('   View mode distribution:', viewModes);
      }
    }
  } catch (error) {
    console.error('Failed to analyze lists:', error);
  }

  // Analyze Items Table (current links)
  console.log('\n\n🔗 ITEMS TABLE ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .limit(20);

    if (itemsError) {
      console.error('❌ Items error:', itemsError);
    } else {
      console.log(`📊 Sample size: ${items.length} items`);
      console.log('🔧 Schema structure:');
      if (items.length > 0) {
        const sample = items[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          const length = value ? value.toString().length : 0;
          console.log(`   ${key}: ${type} (${value ? 'sample length: ' + length : 'null'})`);
        });
        
        console.log('\n📝 ID patterns:');
        items.slice(0, 5).forEach((item, i) => {
          console.log(`   Item ${i+1}: ${item.id} (length: ${item.id?.length})`);
        });
        
        console.log('\n🔍 Data quality:');
        const hasTitle = items.filter(i => i.title).length;
        const hasDescription = items.filter(i => i.description).length;
        const hasImage = items.filter(i => i.image).length;
        const hasFavicon = items.filter(i => i.favicon).length;
        console.log(`   - Items with title: ${hasTitle}/${items.length}`);
        console.log(`   - Items with description: ${hasDescription}/${items.length}`);
        console.log(`   - Items with image: ${hasImage}/${items.length}`);
        console.log(`   - Items with favicon: ${hasFavicon}/${items.length}`);
        
        console.log('\n📊 URL and content analysis:');
        const urlLengths = items.map(i => i.url?.length || 0);
        const avgUrlLength = urlLengths.reduce((a, b) => a + b, 0) / urlLengths.length;
        const maxUrlLength = Math.max(...urlLengths);
        const titleLengths = items.filter(i => i.title).map(i => i.title?.length || 0);
        const avgTitleLength = titleLengths.length > 0 ? titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length : 0;
        
        console.log(`   - Average URL length: ${avgUrlLength.toFixed(1)}`);
        console.log(`   - Max URL length: ${maxUrlLength}`);
        console.log(`   - Average title length: ${avgTitleLength.toFixed(1)}`);
        
        // Check for data inconsistencies
        console.log('\n⚠️  Data quality issues:');
        const duplicateUrls = items.filter((item, index, arr) => 
          arr.findIndex(i => i.url === item.url && i.list_id === item.list_id) !== index
        );
        console.log(`   - Duplicate URL+list combinations: ${duplicateUrls.length}`);
        
        const missingTitles = items.filter(i => !i.title || i.title.trim() === '');
        console.log(`   - Items missing titles: ${missingTitles.length}`);
        
        const orderConflicts = {};
        items.forEach(item => {
          const key = `${item.list_id}-${item.order}`;
          orderConflicts[key] = (orderConflicts[key] || 0) + 1;
        });
        const conflicts = Object.values(orderConflicts).filter(count => count > 1).length;
        console.log(`   - Position conflicts: ${conflicts} list+position combinations with duplicates`);
      }
    }
  } catch (error) {
    console.error('Failed to analyze items:', error);
  }

  // Analyze Relationships
  console.log('\n\n🔗 RELATIONSHIP ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    // Get lists with item counts
    const { data: listStats, error: statsError } = await supabase
      .from('lists')
      .select(`
        id, title, user_id, is_public,
        items!inner(id)
      `);

    if (!statsError && listStats) {
      console.log('📊 List-Item relationships:');
      const itemCounts = listStats.map(list => list.items?.length || 0);
      const avgItemsPerList = itemCounts.reduce((a, b) => a + b, 0) / itemCounts.length;
      const maxItemsPerList = Math.max(...itemCounts);
      const emptyLists = itemCounts.filter(count => count === 0).length;
      
      console.log(`   - Average items per list: ${avgItemsPerList.toFixed(1)}`);
      console.log(`   - Max items in a list: ${maxItemsPerList}`);
      console.log(`   - Empty lists: ${emptyLists}/${listStats.length}`);
      
      // Check user distribution
      const userListCounts = {};
      listStats.forEach(list => {
        userListCounts[list.user_id] = (userListCounts[list.user_id] || 0) + 1;
      });
      const avgListsPerUser = Object.values(userListCounts).reduce((a, b) => a + b, 0) / Object.keys(userListCounts).length;
      const maxListsPerUser = Math.max(...Object.values(userListCounts));
      
      console.log(`   - Average lists per user: ${avgListsPerUser.toFixed(1)}`);
      console.log(`   - Max lists per user: ${maxListsPerUser}`);
      console.log(`   - Total unique users with lists: ${Object.keys(userListCounts).length}`);
    }
  } catch (error) {
    console.error('Failed to analyze relationships:', error);
  }

  console.log('\n\n🎯 ANALYSIS COMPLETE');
  console.log('=' .repeat(50));
}

deepSchemaAnalysis().then(() => {
  console.log('\n✨ Deep analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Analysis failed:', error);
  process.exit(1);
});