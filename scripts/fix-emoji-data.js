#!/usr/bin/env node

/**
 * Script to fix emoji data in the database
 * Updates any lists that have numeric values in the emoji field
 * to use proper Unicode emoji characters
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const { resolve } = require('path')

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixEmojiData() {
  console.log('Starting emoji data fix...')
  
  try {
    // Fetch all lists
    const { data: lists, error: fetchError } = await supabase
      .from('lists')
      .select('id, emoji, emoji_3d')
    
    if (fetchError) {
      console.error('Error fetching lists:', fetchError)
      return
    }
    
    console.log(`Found ${lists?.length || 0} lists to check`)
    
    let fixedCount = 0
    
    for (const list of lists || []) {
      // Check if emoji field contains a number
      if (list.emoji && /^\d+$/.test(list.emoji)) {
        console.log(`Fixing list ${list.id}: emoji was "${list.emoji}"`)
        
        // Update to use a default emoji
        const { error: updateError } = await supabase
          .from('lists')
          .update({ emoji: '✨' }) // Default sparkles emoji
          .eq('id', list.id)
        
        if (updateError) {
          console.error(`Error updating list ${list.id}:`, updateError)
        } else {
          console.log(`✅ Fixed list ${list.id}`)
          fixedCount++
        }
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} lists with numeric emoji values`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the fix
fixEmojiData()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })