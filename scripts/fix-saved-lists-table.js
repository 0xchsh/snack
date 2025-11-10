const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixSavedListsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN

  if (!supabaseUrl || !accessToken) {
    console.error('Missing credentials in .env.local')
    process.exit(1)
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1]

  console.log('Checking saved_lists table structure...\n')

  // First, check current table structure
  const checkQuery = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'saved_lists'
    ORDER BY ordinal_position;
  `

  try {
    let response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: checkQuery })
      }
    )

    let result = await response.json()

    if (response.ok && result.length > 0) {
      console.log('Current table structure:')
      result.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
      })
      console.log()
    }

    // Drop and recreate the table
    const fixQuery = `
-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS saved_lists CASCADE;

-- Create saved_lists junction table
CREATE TABLE saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_saved_lists_user_id ON saved_lists(user_id);
CREATE INDEX idx_saved_lists_list_id ON saved_lists(list_id);
CREATE INDEX idx_saved_lists_saved_at ON saved_lists(saved_at DESC);

-- Enable RLS on saved_lists table
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_lists
-- Users can insert their own saves
CREATE POLICY "Users can save lists" ON saved_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own saved lists
CREATE POLICY "Users can view their saved lists" ON saved_lists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can unsave lists" ON saved_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update list save_count when a save is added/removed
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists SET save_count = save_count + 1 WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update save_count
DROP TRIGGER IF EXISTS trigger_update_save_count ON saved_lists;
CREATE TRIGGER trigger_update_save_count
  AFTER INSERT OR DELETE ON saved_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_list_save_count();
    `

    console.log('Recreating saved_lists table with correct structure...\n')

    response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: fixQuery })
      }
    )

    result = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to fix table:', result)
      process.exit(1)
    }

    console.log('✅ Table recreated successfully!')

    // Verify the new structure
    response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: checkQuery })
      }
    )

    result = await response.json()

    if (response.ok && result.length > 0) {
      console.log('\nNew table structure:')
      result.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixSavedListsTable()
