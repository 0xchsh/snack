# Manual Test Data Creation Guide

Since the automated seed script requires proper Supabase environment configuration, here are manual approaches to create the test user and sample lists:

## Option 1: Direct SQL (if you have Supabase admin access)

### 1. Create Test User
```sql
INSERT INTO users (clerk_id, username, first_name, last_name, created_at, updated_at)
VALUES (
  'test_user_123',
  'test',
  'Test',
  'User',
  NOW(),
  NOW()
);
```

### 2. Get the user ID for subsequent operations
```sql
SELECT id FROM users WHERE username = 'test';
-- Remember this ID for the next steps
```

### 3. Create Sample Lists
```sql
-- Essential Dev Tools (LIST view)
INSERT INTO lists (id, public_id, title, description, emoji, user_id, view_mode, is_public, created_at, updated_at)
VALUES (
  'list_dev_tools_123',
  'dev-tools',
  'Essential Dev Tools',
  'Must-have tools and resources for developers',
  '⚡',
  [USER_ID_FROM_STEP_2],
  'LIST',
  true,
  NOW(),
  NOW()
);

-- Design Inspiration (GALLERY view)
INSERT INTO lists (id, public_id, title, description, emoji, user_id, view_mode, is_public, created_at, updated_at)
VALUES (
  'list_design_123',
  'design-inspo',
  'Design Inspiration',
  'Beautiful websites and design resources',
  '🎨',
  [USER_ID_FROM_STEP_2],
  'GALLERY',
  true,
  NOW(),
  NOW()
);

-- Learning Resources (LIST view)
INSERT INTO lists (id, public_id, title, description, emoji, user_id, view_mode, is_public, created_at, updated_at)
VALUES (
  'list_learning_123',
  'learning',
  'Learning Resources',
  'Great places to learn new skills',
  '📚',
  [USER_ID_FROM_STEP_2],
  'LIST',
  true,
  NOW(),
  NOW()
);

-- Productivity Apps (GALLERY view)
INSERT INTO lists (id, public_id, title, description, emoji, user_id, view_mode, is_public, created_at, updated_at)
VALUES (
  'list_productivity_123',
  'productivity',
  'Productivity Apps',
  'Apps and tools to boost your productivity',
  '🚀',
  [USER_ID_FROM_STEP_2],
  'GALLERY',
  true,
  NOW(),
  NOW()
);
```

### 4. Add Items to Lists

#### Essential Dev Tools Items
```sql
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at) VALUES
('GitHub - Where the world builds software', 'https://github.com', 'The world''s leading software development platform', 'list_dev_tools_123', 0, NOW(), NOW()),
('Stack Overflow - Where Developers Learn, Share, & Build Careers', 'https://stackoverflow.com', 'The largest online community for programmers', 'list_dev_tools_123', 1, NOW(), NOW()),
('MDN Web Docs', 'https://developer.mozilla.org', 'Resources for developers, by developers', 'list_dev_tools_123', 2, NOW(), NOW()),
('Visual Studio Code', 'https://code.visualstudio.com', 'Free source-code editor made by Microsoft', 'list_dev_tools_123', 3, NOW(), NOW());
```

#### Design Inspiration Items
```sql
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at) VALUES
('Dribbble - Discover the World''s Top Designers & Creative Professionals', 'https://dribbble.com', 'Show and tell for designers', 'list_design_123', 0, NOW(), NOW()),
('Behance', 'https://www.behance.net', 'Showcase and discover creative work', 'list_design_123', 1, NOW(), NOW()),
('Awwwards - Website Awards - Best Web Design Trends', 'https://www.awwwards.com', 'The awards for design, creativity and innovation', 'list_design_123', 2, NOW(), NOW()),
('UI Movement - The best UI design inspiration, every day', 'https://uimovement.com', 'UI design inspiration', 'list_design_123', 3, NOW(), NOW());
```

#### Learning Resources Items
```sql
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at) VALUES
('freeCodeCamp.org', 'https://www.freecodecamp.org', 'Learn to code for free', 'list_learning_123', 0, NOW(), NOW()),
('Coursera | Online Courses & Credentials', 'https://www.coursera.org', 'Online courses from top universities', 'list_learning_123', 1, NOW(), NOW()),
('Khan Academy | Free Online Courses, Lessons & Practice', 'https://www.khanacademy.org', 'Free world-class education for anyone, anywhere', 'list_learning_123', 2, NOW(), NOW());
```

#### Productivity Apps Items
```sql
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at) VALUES
('Notion – The all-in-one workspace', 'https://www.notion.so', 'Write, plan, share, and get organized', 'list_productivity_123', 0, NOW(), NOW()),
('Todoist: The to do list to organize work & life', 'https://todoist.com', 'The world''s #1 task manager', 'list_productivity_123', 1, NOW(), NOW()),
('Figma: the collaborative interface design tool', 'https://www.figma.com', 'Design, prototype, and gather feedback', 'list_productivity_123', 2, NOW(), NOW());
```

## Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Use the SQL Editor to run the queries above
4. Or use the table interface to manually insert the data

## Option 3: Fix Environment and Re-run Seed Script

1. Ensure your `.env.local` file has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Restart your development server
3. Run: `curl -X POST http://localhost:3001/api/seed-test-data`

## Expected Result

After creating this test data, you should be able to visit these URLs:

- `http://localhost:3001/test/dev-tools` - Essential Dev Tools (LIST view)
- `http://localhost:3001/test/design-inspo` - Design Inspiration (GALLERY view)  
- `http://localhost:3001/test/learning` - Learning Resources (LIST view)
- `http://localhost:3001/test/productivity` - Productivity Apps (GALLERY view)

Each list will contain 3-4 sample items to demonstrate the functionality.