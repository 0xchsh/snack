-- Step 1: First, check what real users exist in your database
SELECT 
  id,
  clerk_id,
  username,
  first_name,
  last_name,
  created_at
FROM users
WHERE clerk_id IS NOT NULL AND clerk_id != 'test_user_123'
ORDER BY created_at DESC;

-- Step 2: Once you identify a real clerk_id from above, update the test user
-- Replace 'REAL_CLERK_ID_HERE' with an actual clerk_id from step 1
UPDATE users 
SET 
  clerk_id = 'REAL_CLERK_ID_HERE',
  username = 'test'
WHERE username = 'test';

-- Step 3: Verify the update worked
SELECT * FROM users WHERE username = 'test';