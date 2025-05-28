import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ogs from 'open-graph-scraper';
import { extractFaviconFromOG } from '@/lib/favicon';

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { publicId } = await params;
  const user = await currentUser();

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
    const list = await prisma.list.findUnique({
      where: { publicId },
      include: { user: true },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (list.user.clerkId !== user.id) {
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
      }
    } catch (ogError) {
      console.error('OG scraping error:', ogError);
      // Continue with fallback values and get favicon anyway
      favicon = extractFaviconFromOG(url);
    }

    // Get the highest order number and add 1 to put new items at the top
    const highestOrderItem = await prisma.listItem.findFirst({
      where: { listId: list.id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = highestOrderItem ? highestOrderItem.order + 1 : 1;

    // Create the new list item
    const newItem = await prisma.listItem.create({
      data: {
        title,
        url,
        description,
        image,
        favicon,
        order: nextOrder,
        listId: list.id,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create list item:', error);
    return NextResponse.json({ error: 'Failed to create list item' }, { status: 500 });
  }
} 