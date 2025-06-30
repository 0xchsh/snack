-- Create sample lists and items for user 'test'
-- This assumes you already have a user with username 'test' in the users table

-- First, let's get the user ID for the 'test' user
-- (This is just for reference - the queries below will use a subquery to get this automatically)

-- Create the 4 sample lists
INSERT INTO lists (id, public_id, title, description, emoji, user_id, view_mode, is_public, created_at, updated_at)
VALUES 
(
  'list_dev_tools_123',
  'dev-tools',
  'Essential Dev Tools',
  'Must-have tools and resources for developers',
  '⚡',
  (SELECT id FROM users WHERE username = 'test'),
  'LIST',
  true,
  NOW(),
  NOW()
),
(
  'list_design_123',
  'design-inspo',
  'Design Inspiration',
  'Beautiful websites and design resources',
  '🎨',
  (SELECT id FROM users WHERE username = 'test'),
  'GALLERY',
  true,
  NOW(),
  NOW()
),
(
  'list_learning_123',
  'learning',
  'Learning Resources',
  'Great places to learn new skills',
  '📚',
  (SELECT id FROM users WHERE username = 'test'),
  'LIST',
  true,
  NOW(),
  NOW()
),
(
  'list_productivity_123',
  'productivity',
  'Productivity Apps',
  'Apps and tools to boost your productivity',
  '🚀',
  (SELECT id FROM users WHERE username = 'test'),
  'GALLERY',
  true,
  NOW(),
  NOW()
);

-- Create items for Essential Dev Tools (LIST view)
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at)
VALUES 
(
  'GitHub - Where the world builds software',
  'https://github.com',
  'The world''s leading software development platform',
  'list_dev_tools_123',
  0,
  NOW(),
  NOW()
),
(
  'Stack Overflow - Where Developers Learn, Share, & Build Careers',
  'https://stackoverflow.com',
  'The largest online community for programmers',
  'list_dev_tools_123',
  1,
  NOW(),
  NOW()
),
(
  'MDN Web Docs',
  'https://developer.mozilla.org',
  'Resources for developers, by developers',
  'list_dev_tools_123',
  2,
  NOW(),
  NOW()
),
(
  'Visual Studio Code',
  'https://code.visualstudio.com',
  'Free source-code editor made by Microsoft',
  'list_dev_tools_123',
  3,
  NOW(),
  NOW()
);

-- Create items for Design Inspiration (GALLERY view)
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at)
VALUES 
(
  'Dribbble - Discover the World''s Top Designers & Creative Professionals',
  'https://dribbble.com',
  'Show and tell for designers',
  'list_design_123',
  0,
  NOW(),
  NOW()
),
(
  'Behance',
  'https://www.behance.net',
  'Showcase and discover creative work',
  'list_design_123',
  1,
  NOW(),
  NOW()
),
(
  'Awwwards - Website Awards - Best Web Design Trends',
  'https://www.awwwards.com',
  'The awards for design, creativity and innovation',
  'list_design_123',
  2,
  NOW(),
  NOW()
),
(
  'UI Movement - The best UI design inspiration, every day',
  'https://uimovement.com',
  'UI design inspiration',
  'list_design_123',
  3,
  NOW(),
  NOW()
);

-- Create items for Learning Resources (LIST view)
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at)
VALUES 
(
  'freeCodeCamp.org',
  'https://www.freecodecamp.org',
  'Learn to code for free',
  'list_learning_123',
  0,
  NOW(),
  NOW()
),
(
  'Coursera | Online Courses & Credentials',
  'https://www.coursera.org',
  'Online courses from top universities',
  'list_learning_123',
  1,
  NOW(),
  NOW()
),
(
  'Khan Academy | Free Online Courses, Lessons & Practice',
  'https://www.khanacademy.org',
  'Free world-class education for anyone, anywhere',
  'list_learning_123',
  2,
  NOW(),
  NOW()
);

-- Create items for Productivity Apps (GALLERY view)
INSERT INTO items (title, url, description, list_id, "order", created_at, updated_at)
VALUES 
(
  'Notion – The all-in-one workspace',
  'https://www.notion.so',
  'Write, plan, share, and get organized',
  'list_productivity_123',
  0,
  NOW(),
  NOW()
),
(
  'Todoist: The to do list to organize work & life',
  'https://todoist.com',
  'The world''s #1 task manager',
  'list_productivity_123',
  1,
  NOW(),
  NOW()
),
(
  'Figma: the collaborative interface design tool',
  'https://www.figma.com',
  'Design, prototype, and gather feedback',
  'list_productivity_123',
  2,
  NOW(),
  NOW()
);

-- Verify the data was created correctly
SELECT 
  l.title as list_title,
  l.public_id,
  l.view_mode,
  COUNT(i.id) as item_count
FROM lists l
LEFT JOIN items i ON l.id = i.list_id
WHERE l.user_id = (SELECT id FROM users WHERE username = 'test')
GROUP BY l.id, l.title, l.public_id, l.view_mode
ORDER BY l.created_at;