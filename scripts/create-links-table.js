const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createLinksTable() {
  console.log('🔧 Creating links table to match existing schema...\n');

  try {
    // Create the links table with a schema that matches the existing pattern
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS links (
          id TEXT PRIMARY KEY DEFAULT nanoid(),
          list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          title TEXT,
          description TEXT,
          image_url TEXT,
          favicon_url TEXT,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
        CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

        -- Add trigger for updated_at if it doesn't exist
        CREATE OR REPLACE FUNCTION update_links_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER IF NOT EXISTS update_links_updated_at 
        BEFORE UPDATE ON links
        FOR EACH ROW EXECUTE FUNCTION update_links_updated_at();
      `
    });

    if (error) {
      console.error('❌ Error creating links table:', error);
      
      // Try alternative method without rpc
      console.log('Trying alternative creation method...');
      
      // This won't work with most Supabase setups, but let's try a simple insert to test
      const { data: testData, error: testError } = await supabase
        .from('links')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        console.error('❌ Links table definitely does not exist');
        console.log('\n⚠️  Manual action required:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to the SQL Editor');
        console.log('   3. Run this SQL command:');
        console.log('\n' + `
CREATE TABLE links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_links_list_id ON links(list_id);
CREATE INDEX idx_links_position ON links(list_id, position);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_links_updated_at 
BEFORE UPDATE ON links
FOR EACH ROW EXECUTE FUNCTION update_links_updated_at();
        `.trim());
        
      } else {
        console.log('✅ Links table might already exist');
      }
    } else {
      console.log('✅ Links table created successfully!');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createLinksTable().then(() => {
  console.log('\n✨ Links table creation complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Links table creation failed:', error);
  process.exit(1);
});