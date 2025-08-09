import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    const supabase = await createClient();
    console.log('🌱 Starting test data seeding...');
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...'
    });

    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('Database connection test:', { testData, testError });
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    // Step 1: Create test user
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for test user
    const testUsername = 'test';

    // Check if test user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    let userId;
    if (existingUser) {
      console.log('✅ Test user already exists');
      userId = existingUser.id;
    } else {
      // Create test user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          username: testUsername,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) throw userError;
      userId = newUser.id;
      console.log('✅ Test user created');
    }

    // Step 2: Create sample lists
    const sampleLists = [
      {
        title: 'Essential Dev Tools',
        description: 'Must-have tools and resources for developers',
        emoji: '⚡',
        view_mode: 'LIST',
        items: [
          {
            title: 'GitHub - Where the world builds software',
            url: 'https://github.com',
            description: 'The world\'s leading software development platform'
          },
          {
            title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
            url: 'https://stackoverflow.com',
            description: 'The largest online community for programmers'
          },
          {
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org',
            description: 'Resources for developers, by developers'
          },
          {
            title: 'Visual Studio Code',
            url: 'https://code.visualstudio.com',
            description: 'Free source-code editor made by Microsoft'
          }
        ]
      },
      {
        title: 'Design Inspiration',
        description: 'Beautiful websites and design resources',
        emoji: '🎨',
        view_mode: 'GALLERY',
        items: [
          {
            title: 'Dribbble - Discover the World\'s Top Designers & Creative Professionals',
            url: 'https://dribbble.com',
            description: 'Show and tell for designers'
          },
          {
            title: 'Behance',
            url: 'https://www.behance.net',
            description: 'Showcase and discover creative work'
          },
          {
            title: 'Awwwards - Website Awards - Best Web Design Trends',
            url: 'https://www.awwwards.com',
            description: 'The awards for design, creativity and innovation'
          },
          {
            title: 'UI Movement - The best UI design inspiration, every day',
            url: 'https://uimovement.com',
            description: 'UI design inspiration'
          }
        ]
      },
      {
        title: 'Learning Resources',
        description: 'Great places to learn new skills',
        emoji: '📚',
        view_mode: 'LIST',
        items: [
          {
            title: 'freeCodeCamp.org',
            url: 'https://www.freecodecamp.org',
            description: 'Learn to code for free'
          },
          {
            title: 'Coursera | Online Courses & Credentials',
            url: 'https://www.coursera.org',
            description: 'Online courses from top universities'
          },
          {
            title: 'Khan Academy | Free Online Courses, Lessons & Practice',
            url: 'https://www.khanacademy.org',
            description: 'Free world-class education for anyone, anywhere'
          }
        ]
      },
      {
        title: 'Productivity Apps',
        description: 'Apps and tools to boost your productivity',
        emoji: '🚀',
        view_mode: 'GALLERY',
        items: [
          {
            title: 'Notion – The all-in-one workspace',
            url: 'https://www.notion.so',
            description: 'Write, plan, share, and get organized'
          },
          {
            title: 'Todoist: The to do list to organize work & life',
            url: 'https://todoist.com',
            description: 'The world\'s #1 task manager'
          },
          {
            title: 'Figma: the collaborative interface design tool',
            url: 'https://www.figma.com',
            description: 'Design, prototype, and gather feedback'
          }
        ]
      }
    ];

    // Step 3: Create lists and items
    for (const listData of sampleLists) {
      const listId = nanoid();
      const publicId = nanoid(10);

      // Create list
      const { data: newList, error: listError } = await supabase
        .from('lists')
        .insert({
          id: listId,
          public_id: publicId,
          title: listData.title,
          description: listData.description,
          emoji: listData.emoji,
          user_id: userId,
          view_mode: listData.view_mode,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (listError) throw listError;

      // Create items for this list
      for (let i = 0; i < listData.items.length; i++) {
        const item = listData.items[i];
        const { error: itemError } = await supabase
          .from('items')
          .insert({
            title: item.title,
            url: item.url,
            description: item.description,
            list_id: listId,
            order: i,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (itemError) throw itemError;
      }

      console.log(`✅ Created list: ${listData.title} with ${listData.items.length} items`);
    }

    // Step 4: Get final summary
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select(`
        *,
        lists (
          *,
          items (*)
        )
      `)
      .eq('id', testUserId)
      .single();

    if (finalError) throw finalError;

    return NextResponse.json({
      status: 'success',
      message: 'Test data seeded successfully',
      user: {
        username: finalUser.username,
        listsCount: finalUser.lists.length,
        totalItems: finalUser.lists.reduce((acc: number, list: any) => acc + list.items.length, 0)
      },
      lists: finalUser.lists.map((list: any) => ({
        title: list.title,
        publicId: list.public_id,
        itemsCount: list.items.length,
        viewMode: list.view_mode,
        url: `/${testUsername}/${list.public_id}`
      }))
    });

  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      full: error
    });
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create test data',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}