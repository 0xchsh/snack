import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a simple client without cookies for public stats
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cached stats fetcher - refreshes every 5 minutes
const getCachedStats = unstable_cache(
  async () => {
    // Get total public lists count
    const { count: listsCount, error: listsError } = await supabase
      .from('lists')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    if (listsError) {
      console.error('Error fetching lists count:', listsError)
      throw listsError
    }

    // Get total links count
    const { count: linksCount, error: linksError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })

    if (linksError) {
      console.error('Error fetching links count:', linksError)
      throw linksError
    }

    return {
      lists: listsCount || 0,
      links: linksCount || 0,
      updatedAt: new Date().toISOString(),
    }
  },
  ['platform-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['stats'],
  }
)

export async function GET() {
  try {
    const stats = await getCachedStats()

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)

    return NextResponse.json(
      {
        lists: 0,
        links: 0,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 } // Return 200 with zeros on error
    )
  }
}
