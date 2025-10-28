# Analytics Setup Instructions

## Current Status
The analytics feature is implemented in the code but requires database tables to be created in Supabase to start tracking data.

Currently showing:
- **Total Saves**: Real data from your existing `lists.save_count` column
- **Top 5 Lists**: Your actual lists sorted by save count
- **Views & Clicks**: Will show 0 until analytics tables are created

## To Enable Full Analytics Tracking

### Option 1: Run SQL in Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/supabase/migrations/012_add_analytics_tracking.sql`
4. Click "Run" to execute the migration

### Option 2: Use Supabase CLI (if configured)
```bash
# Link your project first
npx supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
npx supabase db push
```

## What Will Be Tracked

Once the tables are created:

1. **Page Views**: 
   - Tracked automatically when someone views your public lists
   - Records viewer info (if logged in), timestamp, referrer

2. **Link Clicks**:
   - Tracked when someone clicks a link in your lists
   - Records which link was clicked and when

3. **Saves**:
   - Already working - tracked in the existing `save_count` column

## Analytics Display

The Profile > Analytics tab shows:
- **Total Views**: Sum of all views across your lists
- **Link Clicks**: Sum of all link clicks across your lists  
- **Total Saves**: Sum of all saves across your lists
- **Top 5 Most Popular Lists**: Your top performing lists with individual metrics

## How It Works

1. When someone visits `/[username]/[list-id]`, a view is recorded
2. When someone clicks a link, the click is tracked
3. The analytics API aggregates this data for display
4. The system gracefully handles missing tables (shows 0s instead of errors)

## Testing

After creating the tables:
1. Visit one of your public lists to generate a view
2. Click a link in the list to generate a click event
3. Check the Analytics tab in your profile to see the data

## Notes

- Analytics are only tracked for public list views
- The system is designed to work with or without the analytics tables
- IP addresses are stored for analytics but can be anonymized if needed for privacy