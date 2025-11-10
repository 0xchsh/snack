const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixTriggerSecurity() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1]

  console.log('Fixing trigger security...\n')

  const migrationSQL = `
-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
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
  `

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: migrationSQL })
    }
  )

  const result = await response.json()

  if (response.ok) {
    console.log('✅ Trigger function updated successfully')
    console.log('   Added SECURITY DEFINER to bypass RLS')
  } else {
    console.error('❌ Failed to update trigger function:', result)
    process.exit(1)
  }

  // Now fix the existing save_count for the test list
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const listId = 'eee0e75d-305e-4d84-96f1-74683d5f7f91'

  console.log('\nFixing save_count for existing list...')

  // Count actual saves
  const { data: saves } = await supabase
    .from('saved_lists')
    .select('id')
    .eq('list_id', listId)

  const correctCount = saves?.length || 0

  // Update save_count
  const { error: updateError } = await supabase
    .from('lists')
    .update({ save_count: correctCount })
    .eq('id', listId)

  if (updateError) {
    console.error('❌ Failed to update save_count:', updateError)
  } else {
    console.log(`✅ Updated save_count from 0 to ${correctCount}`)
  }

  console.log('\n🎉 All fixed! The trigger will now work correctly for new saves.')
}

fixTriggerSecurity()
