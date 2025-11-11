# Dynamic OpenGraph Images

This project now includes dynamically generated OpenGraph (OG) images for list pages. When users share a list on social media platforms like Twitter, LinkedIn, or Facebook, a beautiful custom image will be displayed.

## What's Been Implemented

### 1. OpenGraph Image Generation (`/[username]/[listId]/opengraph-image.tsx`)
- Generates dynamic 1200x630px images using Next.js `ImageResponse` API
- Shows list title, description, username, and link count
- Beautiful gradient background (purple to pink)
- Runs on the edge for fast generation
- Automatically cached by Next.js

### 2. Metadata with OG Tags (`/[username]/[listId]/layout.tsx`)
- Exports `generateMetadata` function that fetches list data
- Adds OpenGraph tags (og:title, og:description, og:image)
- Adds Twitter Card tags for Twitter/X sharing
- Includes canonical URL
- Sets proper alt text for accessibility

## How to Test

### Method 1: Direct Image URL
Visit the OG image directly in your browser:
```
http://localhost:3000/[username]/[listId]/opengraph-image
```

For example:
```
http://localhost:3000/charles/OYn3OTtQ/opengraph-image
```

You should see a PNG image with your list details.

### Method 2: View Page Source
1. Navigate to any list page (e.g., `http://localhost:3000/charles/OYn3OTtQ`)
2. Right-click and select "View Page Source"
3. Look for these meta tags in the `<head>`:
   ```html
   <meta property="og:title" content="..." />
   <meta property="og:description" content="..." />
   <meta property="og:image" content="http://localhost:3000/charles/OYn3OTtQ/opengraph-image" />
   <meta property="og:url" content="..." />
   <meta name="twitter:card" content="summary_large_image" />
   <meta name="twitter:image" content="..." />
   ```

### Method 3: Use Social Media Debug Tools

These tools show exactly what will be displayed when someone shares your link:

**Twitter/X Card Validator:**
1. Go to https://cards-dev.twitter.com/validator
2. Enter your list URL (must be publicly accessible)
3. Click "Preview card"

**Facebook Sharing Debugger:**
1. Go to https://developers.facebook.com/tools/debug/
2. Enter your list URL
3. Click "Debug" to see the preview

**LinkedIn Post Inspector:**
1. Go to https://www.linkedin.com/post-inspector/
2. Enter your list URL
3. View the preview

**Note:** For these tools to work, your site must be:
- Deployed to a public URL (localhost won't work)
- Accessible over HTTPS
- Not blocked by robots.txt

### Method 4: Using Browser Extensions

Install one of these browser extensions to preview OG tags:
- **OpenGraph Preview** (Chrome)
- **Twitter Card Validator** (Chrome)
- **Social Share Preview** (Chrome/Firefox)

## Image Specifications

- **Size:** 1200x630px (recommended for all platforms)
- **Format:** PNG
- **Aspect Ratio:** ~1.91:1
- **File Size:** Optimized automatically by Next.js
- **Platform Support:**
  - Facebook: ✅
  - Twitter/X: ✅ (summary_large_image)
  - LinkedIn: ✅
  - Discord: ✅
  - Slack: ✅
  - iMessage: ✅

## Customization

Want to change the OG image design? Edit:
```
src/app/[username]/[listId]/opengraph-image.tsx
```

You can customize:
- Background color/gradient
- Font sizes and weights
- Layout and spacing
- What information to display
- Add logo or branding

## Production Deployment

When deployed to Vercel:
1. OG images are automatically generated at the edge
2. Images are cached for fast delivery
3. No additional configuration needed
4. Works with incremental static regeneration (ISR)

Make sure to set the `NEXT_PUBLIC_APP_URL` environment variable:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## How It Works

1. User visits a list page
2. Next.js calls `generateMetadata()` in layout.tsx
3. Metadata function fetches list data from API
4. Returns meta tags with OG image URL
5. When social media bots request the OG image URL
6. Next.js generates the image on-the-fly
7. Image is cached for subsequent requests

## Troubleshooting

**OG image not showing?**
- Check that the list is public (private lists won't have OG images)
- Verify the list exists and has data
- Check browser console for errors
- Try clearing your browser cache
- Use the debug tools mentioned above

**Image looks wrong?**
- Check that list data is loading correctly
- Verify API endpoint is working
- Look at the opengraph-image.tsx file for layout issues

**Slow generation?**
- First generation is slower (cold start)
- Subsequent requests are cached
- In production, edge runtime is much faster
