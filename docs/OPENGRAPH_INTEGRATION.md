# OpenGraph.io Integration Guide

## Overview

This application uses OpenGraph.io API to fetch rich metadata (title, description, images, favicons) from URLs when adding links to lists. This provides a better user experience with visual previews and automatic title extraction.

## Features

- **Automatic metadata extraction**: Fetches title, description, and Open Graph images
- **Favicon detection**: Gets high-quality favicon URLs
- **Fallback support**: Works even without API key using predefined patterns
- **Caching**: Results are cached for 24 hours to reduce API calls
- **Client and server-side support**: Works in both contexts

## Setup

### 1. Get an OpenGraph.io API Key

1. Visit [OpenGraph.io](https://www.opengraph.io/)
2. Sign up for an account
3. Navigate to your dashboard
4. Create a new API key
5. Copy the API key

### 2. Configure Environment Variable

Add your API key to `.env.local`:

```env
OPENGRAPH_IO_API_KEY=your_actual_api_key_here
```

### 3. Verify Integration

The integration will automatically start working once the API key is configured. Test it by:

1. Creating a new list
2. Adding a URL (e.g., `https://github.com/vercel/next.js`)
3. The title and image should be automatically fetched

## API Usage

### Client-Side (React Components)

```typescript
import { fetchOGDataClient } from '@/lib/og-client'

const ogData = await fetchOGDataClient('https://example.com')
console.log(ogData.title, ogData.image_url)
```

### Server-Side (API Routes)

```typescript
import { fetchOpenGraphDataServer } from '@/lib/opengraph-io'

const ogData = await fetchOpenGraphDataServer('https://example.com')
```

### API Endpoint

You can also use the API endpoint directly:

```bash
# POST request
curl -X POST http://localhost:3000/api/opengraph \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com"}'

# GET request (for testing)
curl http://localhost:3000/api/opengraph?url=https://github.com
```

## Data Structure

The OpenGraph data returned includes:

```typescript
interface OGData {
  title: string | null        // Page title
  description: string | null  // Page description
  image_url: string | null    // Open Graph image URL
  favicon_url: string | null  // Site favicon URL
  site_name: string | null    // Website name
}
```

## Fallback Behavior

If the API key is not configured or the API fails, the system falls back to:

1. **Known patterns**: Predefined OG data for popular sites (GitHub, Vercel, Figma, etc.)
2. **Google Favicons**: Uses Google's favicon service as backup
3. **Default values**: Uses hostname as title if nothing else works

## Rate Limits

OpenGraph.io has the following rate limits (varies by plan):

- **Free tier**: Limited requests per month
- **Paid plans**: Higher limits available

Check your [OpenGraph.io dashboard](https://dashboard.opengraph.io/) for current usage.

## Troubleshooting

### No metadata fetched

1. Check if API key is correctly set in `.env.local`
2. Verify the URL is publicly accessible
3. Check API usage limits in your OpenGraph.io dashboard

### Slow response times

- The first request to a URL may be slower as OpenGraph.io fetches the data
- Subsequent requests are cached for 24 hours

### CORS errors

- The API route handles CORS, so always use `/api/opengraph` endpoint from client-side

## MCP Integration (Future)

OpenGraph.io supports MCP (Model Context Protocol) integration. To enable:

1. Add to `mcp.json`:
```json
{
  "mcpServers": {
    "opengraph": {
      "command": "npx",
      "args": ["-y", "@opengraph/mcp-server"],
      "env": {
        "OPENGRAPH_API_KEY": "${OPENGRAPH_IO_API_KEY}"
      }
    }
  }
}
```

2. The MCP server will provide additional context about URLs to AI assistants.

## Support

- [OpenGraph.io Documentation](https://www.opengraph.io/documentation)
- [API Status](https://status.opengraph.io/)
- Support email: support@opengraph.io