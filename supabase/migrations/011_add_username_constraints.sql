-- Add username validation constraints
-- This ensures usernames follow the format rules defined in username-utils.ts

-- Add check constraints for username validation
ALTER TABLE users ADD CONSTRAINT username_length_check 
  CHECK (length(username) >= 3 AND length(username) <= 30);

ALTER TABLE users ADD CONSTRAINT username_format_check 
  CHECK (username ~ '^[a-zA-Z0-9_-]+$');

ALTER TABLE users ADD CONSTRAINT username_start_end_check 
  CHECK (NOT (username LIKE '-%' OR username LIKE '_%' OR username LIKE '%_' OR username LIKE '%-'));

ALTER TABLE users ADD CONSTRAINT username_no_consecutive_special_check 
  CHECK (NOT (username LIKE '%__%' OR username LIKE '%--%' OR username LIKE '%_-%' OR username LIKE '%-_%'));

-- Create function to validate reserved usernames
CREATE OR REPLACE FUNCTION is_reserved_username(username_input text) 
RETURNS boolean AS $$
BEGIN
  RETURN lower(username_input) = ANY(ARRAY[
    'auth', 'api', 'profile', 'dashboard', 'demo', 'u', 'list',
    'public-demo', 'dashboard-simple', 'admin', 'administrator', 
    'root', 'www', 'mail', 'ftp', 'assets', 'static', '_next',
    'about', 'help', 'support', 'contact', 'terms', 'privacy',
    'settings', 'account', 'login', 'logout', 'signup', 'signin',
    'register', 'forgot', 'reset', 'verify', 'confirm',
    'home', 'index', 'main', 'app', 'application',
    'get', 'post', 'put', 'delete', 'patch', 'head', 'options',
    'null', 'undefined', 'true', 'false', 'test', 'staging',
    'snack', 'snacks', 'lists', 'links', 'link'
  ]);
END;
$$ LANGUAGE plpgsql;

-- Add constraint to prevent reserved usernames
ALTER TABLE users ADD CONSTRAINT username_not_reserved_check 
  CHECK (NOT is_reserved_username(username));

-- Create index for case-insensitive username lookups
CREATE INDEX idx_users_username_lower ON users(lower(username));