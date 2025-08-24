# Supabase Setup Instructions

## Database Setup

To set up your Supabase database for the Snack application, you need to run the migration files in the `migrations` folder.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Run each migration file in order:
   - First, run `001_create_tables.sql`
   - Then, run `002_create_users_table.sql`

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (you'll need your project ID)
supabase link --project-ref <your-project-id>

# Run migrations
supabase db push
```

## Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase Dashboard under **Settings > API**.

## Testing the Setup

After running the migrations, your application should automatically start using Supabase for data storage instead of localStorage. The hybrid system will:

1. First attempt to use Supabase
2. Fall back to localStorage if Supabase is unavailable
3. Show the storage method being used in the console logs

## Troubleshooting

If you encounter issues:

1. **RLS Policies**: Make sure Row Level Security is enabled and policies are correctly set up
2. **Authentication**: The system supports both Supabase Auth and mock authentication for development
3. **Migration Errors**: If a migration fails, check that you're running them in the correct order

## Schema Overview

The database consists of three main tables:

- **users**: Stores user profiles (supports mock auth)
- **lists**: Stores user lists with emojis and metadata
- **links**: Stores links within lists with OG data

All tables have Row Level Security enabled with policies that allow users to manage their own data.