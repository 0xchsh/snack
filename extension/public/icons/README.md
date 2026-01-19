# Extension Icons

Before loading the extension in Chrome, you need to create PNG icons in these sizes:

- `icon16.png` (16x16) - Favicon in toolbar
- `icon32.png` (32x32) - Windows taskbar
- `icon48.png` (48x48) - Extension management page
- `icon128.png` (128x128) - Chrome Web Store

## Quick Generation

### Option 1: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload a 512x512 or larger image of the pretzel (🥨) on orange (#f97316) background
3. Download the generated icons
4. Rename and place here

### Option 2: Using ImageMagick
```bash
# Create a base SVG first, then convert:
convert -size 128x128 xc:#f97316 -fill white -gravity center \
  -font Apple-Color-Emoji -pointsize 80 -annotate +0+0 '🥨' \
  icon128.png

# Then resize for other sizes:
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png
```

### Option 3: Using Figma/Sketch
1. Create a 128x128 frame
2. Fill with #f97316 (Snack orange)
3. Add 🥨 emoji or pretzel vector icon
4. Export at 1x, 0.375x, 0.25x, 0.125x for different sizes

## Design Guidelines
- Background: #f97316 (Snack brand orange)
- Icon: Pretzel emoji or custom pretzel icon
- Style: Solid background with white/light icon
- Corners: Slightly rounded for larger sizes
