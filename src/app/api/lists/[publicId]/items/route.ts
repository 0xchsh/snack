import { NextResponse } from 'next/server';
// import { currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import ogs from 'open-graph-scraper';
import { extractFaviconFromOG } from '@/lib/favicon';

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  // const user = await currentUser();
  const user = null; // Temporarily disabled

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Find the list and verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*, user:users(clerk_id)')
      .eq('public_id', publicId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (list.user.clerk_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch OG data and favicon
    let title = url;
    let description = null;
    let image = null;
    let favicon = null;

    try {
      const { error, result } = await ogs({ url });
      
      if (!error && result) {
        title = result.ogTitle || result.twitterTitle || result.dcTitle || url;
        description = result.ogDescription || result.twitterDescription || result.dcDescription || null;
        image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null;
        
        // Use improved favicon extraction
        favicon = extractFaviconFromOG(url, result);
      } else if (error) {
        return NextResponse.json({ error: `OG scraping failed: ${result?.error || 'Unknown error'}` }, { status: 400 });
      }
    } catch (ogError) {
      console.error('OG scraping error:', ogError);
      return NextResponse.json({ error: 'Failed to fetch Open Graph data for this URL.' }, { status: 400 });
    }

    // Get the highest order number and add 1 to put new items at the top
    const { data: highestOrderItem } = await supabase
      .from('items')
      .select('order')
      .eq('list_id', list.id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = highestOrderItem ? highestOrderItem.order + 1 : 1;

    // Create the new list item
    const { data: newItem, error: createError } = await supabase
      .from('items')
      .insert([
        {
        title,
        url,
        description,
        image,
        favicon,
        order: nextOrder,
          list_id: list.id,
      },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Supabase insert error:', createError);
      return NextResponse.json({ error: `Failed to create list item: ${createError.message}` }, { status: 500 });
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create list item:', error);
    return NextResponse.json({ error: 'Failed to create list item' }, { status: 500 });
  }
} 