# Snack Chrome Extension

Save links from Twitter/X to your Snack lists with one click.

## Features

- **Injected Save Button**: A Snack button appears next to tweet action buttons on tweets containing external links
- **Quick Save**: Select a list from the dropdown to save links instantly
- **Multi-Link Support**: Save all external links from a tweet at once
- **Inline List Creation**: Create new lists without leaving Twitter
- **Authentication**: Secure OAuth-style authentication with your Snack account

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- The main Snack Next.js app running locally

### Installation

1. From the repository root, install dependencies:
   ```bash
   npm install
   cd extension
   npm install
   ```

2. Create extension icons (see `public/icons/README.md` for instructions)

3. Build the extension:
   ```bash
   npm run build
   ```

4. For development with auto-reload:
   ```bash
   npm run dev
   ```

### Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The Snack extension should now appear in your extensions

### Testing

1. Make sure the main Snack app is running (`npm run dev` in root)
2. Go to Twitter/X.com
3. Find a tweet with an external link
4. Click the 🥨 button that appears in the tweet's action bar
5. Sign in to Snack when prompted
6. Select a list to save the link(s)

## Project Structure

```
extension/
├── public/
│   ├── manifest.json      # Chrome extension manifest
│   ├── popup.html         # Extension popup HTML
│   ├── callback.html      # OAuth callback page
│   └── icons/             # Extension icons (PNG)
├── src/
│   ├── background/
│   │   ├── service-worker.ts   # Background script
│   │   ├── api.ts              # API client
│   │   └── auth.ts             # Token management
│   ├── content/
│   │   ├── twitter.ts          # Main content script
│   │   ├── tweet-detector.ts   # Tweet detection logic
│   │   ├── link-extractor.ts   # Link extraction from tweets
│   │   └── ui/
│   │       ├── SnackButton.tsx # Save button component
│   │       ├── ListDropdown.tsx # List selector dropdown
│   │       └── Toast.tsx       # Toast notifications
│   ├── popup/
│   │   ├── index.tsx           # Popup entry point
│   │   ├── App.tsx             # Popup main component
│   │   └── components/         # Popup UI components
│   ├── shared/
│   │   ├── types.ts            # TypeScript types
│   │   ├── constants.ts        # Configuration constants
│   │   ├── storage.ts          # Chrome storage utilities
│   │   └── utils.ts            # Shared utilities
│   └── styles/
│       ├── content.css         # Content script styles
│       └── popup.css           # Popup styles
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── postcss.config.js
```

## API Endpoints

The extension communicates with these API endpoints on the main Snack app:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/extension/auth/authorize` | POST | Cookie | Generate auth code |
| `/api/extension/auth/token` | POST | None | Exchange code for tokens |
| `/api/extension/auth/refresh` | POST | None | Refresh access token |
| `/api/extension/auth/revoke` | POST | None | Revoke tokens (logout) |
| `/api/extension/lists` | GET | Token | Get user's lists |
| `/api/extension/lists` | POST | Token | Create new list |
| `/api/extension/lists/[id]/links` | POST | Token | Add links to list |

## Authentication Flow

1. User clicks "Sign in to Snack" in extension
2. New tab opens to `snack.xyz/extension/auth`
3. If not logged in, redirects to login page
4. After login, generates one-time auth code
5. Redirects to `chrome-extension://[ID]/callback.html?code=XXX`
6. Extension exchanges code for access + refresh tokens
7. Tokens stored in `chrome.storage.local`

Tokens:
- Access token: 1 hour expiry, auto-refreshed
- Refresh token: 30 day expiry

## Building for Production

```bash
cd extension
npm run build
```

The built extension will be in `extension/dist/`. Zip this folder for Chrome Web Store submission.

## Troubleshooting

### Button not appearing on tweets
- Make sure the extension is enabled
- Refresh the Twitter page
- Check that the tweet contains an external link (not just mentions or hashtags)

### Authentication issues
- Try signing out and signing back in
- Make sure cookies are enabled
- Check that the main Snack app is accessible

### "Not authenticated" errors
- Your session may have expired
- Try signing out and signing back in from the popup
