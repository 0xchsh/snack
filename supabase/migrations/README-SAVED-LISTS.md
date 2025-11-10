# Saved Lists Migration

## To apply this migration:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `014_add_saved_lists.sql`
4. Click "Run" to execute the migration

This migration adds:
- `saved_lists` table to track which users have saved which lists
- Indexes for performance
- Row Level Security (RLS) policies
- Trigger to automatically update the `save_count` column on lists

## Testing

After running the migration, test by:
1. Viewing a public list as a logged-in user
2. Clicking the heart icon to save the list
3. Checking that the heart fills with pink color
4. Checking that "Saved successfully!" toast appears
5. Refreshing the page to verify the saved state persists
