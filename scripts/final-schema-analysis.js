const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function finalAnalysis() {
  console.log('🎯 FINAL COMPLETE DATABASE ANALYSIS\n');
  console.log('=' .repeat(60));

  // Complete Users Analysis
  console.log('\n👤 USERS TABLE - COMPLETE ANALYSIS');
  console.log('-'.repeat(40));
  
  try {
    const { data: users, count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    console.log(`📊 Total users: ${userCount}`);
    if (users && users.length > 0) {
      console.log('\n🔧 Complete schema:');
      Object.keys(users[0]).forEach(key => {
        console.log(`   ${key}: ${typeof users[0][key]}`);
      });
      
      console.log('\n📝 All user IDs and patterns:');
      users.forEach((user, i) => {
        console.log(`   ${i+1}. ID: "${user.id}" (len: ${user.id?.length || 0})`);
        console.log(`      Username: "${user.username}"`);
        console.log(`      Clerk ID: "${user.clerk_id}"`);
        console.log(`      Names: "${user.first_name}" "${user.last_name}"`);
      });
    }
  } catch (error) {
    console.error('❌ Users analysis failed:', error);
  }

  // Complete Lists Analysis
  console.log('\n\n📋 LISTS TABLE - COMPLETE ANALYSIS');
  console.log('-'.repeat(40));
  
  try {
    const { data: lists, count: listCount } = await supabase
      .from('lists')
      .select('*', { count: 'exact' });

    console.log(`📊 Total lists: ${listCount}`);
    if (lists && lists.length > 0) {
      console.log('\n🔧 Complete schema:');
      Object.keys(lists[0]).forEach(key => {
        console.log(`   ${key}: ${typeof lists[0][key]}`);
      });
      
      console.log('\n📝 ID patterns analysis:');
      const idLengths = {};
      const publicIdLengths = {};
      
      lists.forEach(list => {
        const idLen = list.id?.length || 0;
        const pubIdLen = list.public_id?.length || 0;
        idLengths[idLen] = (idLengths[idLen] || 0) + 1;
        publicIdLengths[pubIdLen] = (publicIdLengths[pubIdLen] || 0) + 1;
      });
      
      console.log('   ID length distribution:', idLengths);
      console.log('   Public ID length distribution:', publicIdLengths);
      
      console.log('\n📈 Sample data patterns:');
      lists.slice(0, 5).forEach((list, i) => {
        console.log(`   ${i+1}. "${list.title}" (${list.emoji})`);
        console.log(`      ID: ${list.id} (${list.id?.length})`);
        console.log(`      Public: ${list.public_id} (${list.public_id?.length})`);
        console.log(`      User: ${list.user_id}`);
        console.log(`      Public: ${list.is_public}, Mode: ${list.view_mode}`);
      });
    }
  } catch (error) {
    console.error('❌ Lists analysis failed:', error);
  }

  // Complete Links Analysis  
  console.log('\n\n🔗 LINKS TABLE - COMPLETE ANALYSIS');
  console.log('-'.repeat(40));
  
  try {
    const { data: links, count: linkCount } = await supabase
      .from('links')
      .select('*', { count: 'exact' });

    console.log(`📊 Total links: ${linkCount}`);
    if (links && links.length > 0) {
      console.log('\n🔧 Complete schema:');
      Object.keys(links[0]).forEach(key => {
        console.log(`   ${key}: ${typeof links[0][key]}`);
      });
      
      console.log('\n📝 ID patterns:');
      console.log('   All links use UUID format (36 chars)');
      
      console.log('\n📊 Content analysis:');
      const urlLengths = links.map(l => l.url?.length || 0);
      const titleLengths = links.filter(l => l.title).map(l => l.title?.length || 0);
      
      console.log(`   - URL length: avg ${(urlLengths.reduce((a,b) => a+b, 0) / urlLengths.length).toFixed(1)}, max ${Math.max(...urlLengths)}`);
      console.log(`   - Title length: avg ${titleLengths.length > 0 ? (titleLengths.reduce((a,b) => a+b, 0) / titleLengths.length).toFixed(1) : 0}, max ${titleLengths.length > 0 ? Math.max(...titleLengths) : 0}`);
      
      const withImage = links.filter(l => l.image_url).length;
      const withFavicon = links.filter(l => l.favicon_url).length;
      console.log(`   - With image_url: ${withImage}/${links.length} (${(withImage/links.length*100).toFixed(1)}%)`);
      console.log(`   - With favicon_url: ${withFavicon}/${links.length} (${(withFavicon/links.length*100).toFixed(1)}%)`);
      
      console.log('\n🎯 Position analysis:');
      const positions = links.map(l => l.position);
      const maxPosition = Math.max(...positions);
      const positionCounts = {};
      positions.forEach(pos => {
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      
      console.log(`   - Position range: 0 to ${maxPosition}`);
      console.log(`   - Position 0 usage: ${positionCounts[0] || 0} links`);
      console.log(`   - Position 1 usage: ${positionCounts[1] || 0} links`);
    }
  } catch (error) {
    console.error('❌ Links analysis failed:', error);
  }

  console.log('\n\n🔍 CROSS-TABLE RELATIONSHIP ANALYSIS');
  console.log('-'.repeat(40));
  
  try {
    // Check user-list relationships
    const { data: userListRelations } = await supabase
      .from('lists')
      .select('user_id')
      .neq('user_id', null);
    
    if (userListRelations) {
      const userIds = [...new Set(userListRelations.map(l => l.user_id))];
      console.log(`👥 Unique users with lists: ${userIds.length}`);
      
      const { data: actualUsers } = await supabase
        .from('users')
        .select('id')
        .neq('id', null);
      
      if (actualUsers) {
        const actualUserIds = actualUsers.map(u => u.id);
        const orphanedLists = userIds.filter(id => !actualUserIds.includes(id));
        console.log(`⚠️  Orphaned lists (user doesn't exist): ${orphanedLists.length}`);
        if (orphanedLists.length > 0) {
          console.log(`   Orphaned user IDs: ${orphanedLists.slice(0, 3).join(', ')}${orphanedLists.length > 3 ? '...' : ''}`);
        }
      }
    }

    // Check list-link relationships  
    const { data: listLinkRelations } = await supabase
      .from('links')
      .select('list_id')
      .neq('list_id', null);
    
    if (listLinkRelations) {
      const listIds = [...new Set(listLinkRelations.map(l => l.list_id))];
      console.log(`📋 Unique lists with links: ${listIds.length}`);
      
      const { data: actualLists } = await supabase
        .from('lists')
        .select('id')
        .neq('id', null);
      
      if (actualLists) {
        const actualListIds = actualLists.map(l => l.id);
        const orphanedLinks = listIds.filter(id => !actualListIds.includes(id));
        console.log(`⚠️  Orphaned links (list doesn't exist): ${orphanedLinks.length}`);
      }
    }

  } catch (error) {
    console.error('❌ Relationship analysis failed:', error);
  }

  console.log('\n\n🎯 ANALYSIS COMPLETE');
  console.log('=' .repeat(60));
}

finalAnalysis().then(() => {
  console.log('\n✨ Complete database analysis finished!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Complete analysis failed:', error);
  process.exit(1);
});