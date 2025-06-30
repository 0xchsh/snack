-- Check what users exist in the database
SELECT 
  id,
  clerk_id,
  username,
  first_name,
  last_name,
  created_at
FROM users
ORDER BY created_at DESC;