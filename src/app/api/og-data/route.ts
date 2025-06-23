import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import ogs from 'open-graph-scraper';

export async function POST(request: Request) {
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

    // Special handling for YouTube links
    const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|user\/.*#p\/u\/\d+\/))([\w-]{11})/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      // Fetch title using YouTube oEmbed (no API key required)
      try {
        const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oEmbedRes.ok) {
          const oEmbed = await oEmbedRes.json();
          return NextResponse.json({
            title: oEmbed.title,
            description: oEmbed.author_name ? `by ${oEmbed.author_name}` : null,
            image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            siteName: 'YouTube',
            url: url
          });
        }
      } catch (err) {
        // If oEmbed fails, fallback to OG scraping below
        console.warn('YouTube oEmbed failed:', err);
      }
      // Fallback: just use the thumbnail and video ID as title
      return NextResponse.json({
        title: `YouTube Video (${videoId})`,
        description: null,
        image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        siteName: 'YouTube',
        url: url
      });
    }

    // Fetch OG data
    const { error, result } = await ogs({ url });

    if (error) {
      console.error('OG scraping error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch page data',
        fallback: {
          title: url,
          description: null,
          image: null
        }
      }, { status: 200 });
    }

    // Extract relevant data
    const ogData = {
      title: result.ogTitle || result.twitterTitle || result.dcTitle || url,
      description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      siteName: result.ogSiteName || null,
      url: result.ogUrl || url
    };

    return NextResponse.json(ogData);
  } catch (error) {
    console.error('Failed to fetch OG data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch page data',
      fallback: {
        title: 'Unknown',
        description: null,
        image: null
      }
    }, { status: 500 });
  }
} 