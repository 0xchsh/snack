# Snack Mobile App

React Native / Expo mobile app for Snack - browse, discover, save, and purchase curated link collections.

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on your physical device (optional)

## Setup

1. Install dependencies from the monorepo root:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Fill in the environment variables in `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `EXPO_PUBLIC_REVENUECAT_API_KEY` - Your RevenueCat API key (for IAP)

## Development

Start the development server:

```bash
# From monorepo root
npm run dev:mobile

# Or from this directory
npm run dev
```

Then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your device

## Project Structure

```
apps/mobile/
\u251c\u2500\u2500 app/                    # Expo Router pages
\u2502   \u251c\u2500\u2500 (auth)/             # Auth screens (sign-in, sign-up)
\u2502   \u251c\u2500\u2500 (tabs)/             # Main tab navigation
\u2502   \u251c\u2500\u2500 list/              # List detail screen
\u2502   \u251c\u2500\u2500 user/              # User profile screen
\u2502   \u2514\u2500\u2500 purchase/          # Purchase flow screens
\u251c\u2500\u2500 src/
\u2502   \u251c\u2500\u2500 components/        # Reusable UI components
\u2502   \u251c\u2500\u2500 constants/         # App configuration
\u2502   \u251c\u2500\u2500 hooks/             # React Query hooks
\u2502   \u251c\u2500\u2500 lib/               # Utilities (Supabase, RevenueCat, etc.)
\u2502   \u2514\u2500\u2500 providers/         # Context providers
\u251c\u2500\u2500 assets/                 # App icons and splash screens
\u251c\u2500\u2500 app.json               # Expo configuration
\u251c\u2500\u2500 babel.config.js
\u251c\u2500\u2500 metro.config.js        # Metro bundler config for monorepo
\u2514\u2500\u2500 tsconfig.json
```

## Key Features

- **Authentication**: Email/password, Apple Sign In, Google Sign In via Supabase
- **Discover Feed**: Infinite scroll list of public curated links
- **List Detail**: View list links, save/unsave, purchase paid lists
- **User Profiles**: View creator profiles and their public lists
- **Saved Lists**: Quick access to bookmarked lists
- **In-App Purchase**: Buy paid lists via Apple IAP (RevenueCat)
- **Deep Linking**: Universal links for `snack.app` and `snack://` scheme

## Building for Production

### iOS (via EAS Build)

```bash
npm run build:ios
```

### Android (via EAS Build)

```bash
npm run build:android
```

### Preview Build (internal testing)

```bash
npm run build:preview
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat API key |

## App Store Submission Checklist

- [ ] Set up App Store Connect and create app record
- [ ] Configure RevenueCat with App Store Connect
- [ ] Create IAP products in App Store Connect
- [ ] Update `app.json` with EAS project ID
- [ ] Add App Store icon (1024x1024)
- [ ] Add splash screen assets
- [ ] Prepare screenshots for all device sizes
- [ ] Write app description and keywords
- [ ] Set up privacy policy URL
- [ ] Configure associated domains for universal links
- [ ] Enable Sign in with Apple capability
- [ ] Test full purchase flow in TestFlight

## Shared Code

This app uses shared types and utilities from `@snack/shared`:

```typescript
import { User, List, ListWithLinks } from '@snack/shared/types';
import { formatCurrency, isListFree } from '@snack/shared/pricing';
```
