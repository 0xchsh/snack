import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenGraphDataServer } from '@/lib/opengraph-io'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    // Fetch OG data using server-side function
    const ogData = await fetchOpenGraphDataServer(url)

    return NextResponse.json(ogData)

  } catch (error) {
    console.error('Error in OpenGraph API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OpenGraph data' },
      { status: 500 }
    )
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    )
  }

  const ogData = await fetchOpenGraphDataServer(url)
  return NextResponse.json(ogData)
}