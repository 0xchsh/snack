#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixShortIds() {
  console.log('🔧 Fixing short ID generation function...');

  // Update the function to use URL-safe alphabet
  const { error: funcError } = await supabase.rpc('sql', {
    query: `
      CREATE OR REPLACE FUNCTION generate_short_id(length integer DEFAULT 8)
      RETURNS text AS $$
      DECLARE
          -- URL-safe alphabet (no confusing chars like 0/O, 1/I/l)
          alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
          result text := '';
          i integer;
      BEGIN
          FOR i IN 1..length LOOP
              result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
          END LOOP;
          RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  if (funcError) {
    console.error('❌ Error updating function:', funcError);
    return;
  }

  console.log('✅ Function updated successfully');

  // Update existing lists
  const { error: updateError } = await supabase.rpc('sql', {
    query: `UPDATE lists SET public_id = generate_short_id(8) WHERE public_id IS NOT NULL;`
  });

  if (updateError) {
    console.error('❌ Error updating lists:', updateError);
    return;
  }

  console.log('✅ Existing lists updated with new short IDs');

  // Test the fix
  console.log('\n🧪 Testing short ID generation...');
  const { data: testData, error: testError } = await supabase.rpc('generate_short_id', { length: 8 });

  if (testError) {
    console.error('❌ Test failed:', testError);
  } else {
    console.log('✅ Generated test ID:', testData);
  }
}

fixShortIds().catch(console.error);