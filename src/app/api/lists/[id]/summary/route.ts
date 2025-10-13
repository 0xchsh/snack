import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateListSummary } from '@/lib/ai-summary'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/lists/[id]/summary
 * Retrieve the AI summary for a list
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params

    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Fetch the list with its AI summary
    const { data: list, error } = await supabase
      .from('lists')
      .select('id, title, ai_summary, ai_themes, ai_generated_at, is_public')
      .eq('id', listId)
      .single()

    if (error || !list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Only allow access to public lists or authenticated owners
    const { data: { user } } = await supabase.auth.getUser()
    if (!list.is_public && (!user || list.user_id !== user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: list.ai_summary,
        themes: list.ai_themes,
        generatedAt: list.ai_generated_at,
      },
    })
  } catch (error) {
    console.error('Error retrieving AI summary:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve AI summary' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/lists/[id]/summary
 * Generate or regenerate an AI summary for a list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params

    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Get current user (may be null for public lists)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch the list with links
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select(`
        id,
        user_id,
        title,
        is_public,
        links (
          id,
          url,
          title,
          description,
          position
        )
      `)
      .eq('id', listId)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Verify ownership for private lists, allow public lists without auth
    if (!list.is_public) {
      if (!user || list.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Only list owners can generate summaries for private lists' },
          { status: 403 }
        )
      }
    }

    // Sort links by position
    const sortedLinks = (list.links || []).sort((a: any, b: any) => a.position - b.position)

    // Generate AI summary
    const { summary, themes, error: summaryError } = await generateListSummary(
      list.title,
      sortedLinks
    )

    if (summaryError) {
      return NextResponse.json(
        { error: `Failed to generate summary: ${summaryError}` },
        { status: 500 }
      )
    }

    // Update the list with the generated summary
    // Use service role key for updates to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: updatedList, error: updateError } = await supabaseAdmin
      .from('lists')
      .update({
        ai_summary: summary,
        ai_themes: themes,
        ai_generated_at: new Date().toISOString(),
      })
      .eq('id', listId)
      .select('ai_summary, ai_themes, ai_generated_at')
      .single()

    if (updateError) {
      console.error('Error updating list with AI summary:', updateError)
      console.error('List ID:', listId)
      console.error('Summary:', summary)
      console.error('Themes:', themes)
      return NextResponse.json(
        { error: 'Failed to save AI summary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: updatedList.ai_summary,
        themes: updatedList.ai_themes,
        generatedAt: updatedList.ai_generated_at,
      },
    })
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI summary' },
      { status: 500 }
    )
  }
}
