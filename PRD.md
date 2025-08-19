# Link Curation Platform - Product Requirements Document

## Product Overview

A web-based platform that allows content creators to curate, organize, and share collections of links through visually appealing lists. Users can create personalized, shareable link collections with monetization options and basic analytics.

## Target Users

**Primary**: Content creators who want to organize and monetize curated link collections
**Secondary**: Users who discover and bookmark interesting link collections

## Core User Flows

### 1. New User Onboarding
1. User visits platform and can browse Explore page without account
2. User signs up via email or Google login
3. User is taken to empty dashboard with prompt to create first list
4. User creates first list with emoji, title, and initial links

### 2. List Creation Flow
1. User clicks "Create New List" from dashboard
2. User selects emoji for the list
3. User enters list title
4. User adds links by pasting URLs (single or multiple)
5. System fetches metadata (og:title, og:image, favicon) with loading state
6. User can reorder links via drag-and-drop
7. User sets list as public/private and optionally adds paywall price
8. List is automatically saved and shareable

### 3. List Discovery Flow
1. User visits Explore page to see most popular lists (ranked by total views)
2. User can search for lists by title, emoji, or user profiles
3. User clicks on list to view content
4. For paid lists: user sees first 3 links, rest are blurred with paywall
5. User can bookmark interesting lists to their "Saved" section
6. User can visit creator profiles to see all their public lists

### 4. List Management Flow
1. User accesses dashboard with two main sections:
   - "My Lists" - all created lists
   - "Saved Lists" - bookmarked lists from others
2. User can edit any of their lists:
   - Change emoji and title
   - Add/delete/reorder links
   - Toggle privacy settings
   - Update paywall pricing
   - Delete entire list
3. User views analytics for their lists in dedicated stats section

## Feature Requirements

### Core Features (V1)

#### User Authentication
- Email registration and login
- Google OAuth integration
- Basic profile creation with username and display name

#### List Creation & Management
- Create lists with emoji and title
- Add unlimited links (up to 100 per list, 100 lists per user)
- Automatic metadata extraction (og:title, og:image, favicon)
- Fallback handling: use domain for missing titles, placeholder for missing images
- Drag-and-drop reordering using smooth animations
- Public/private list settings
- List editing and deletion capabilities

#### Link Management
- Support for any valid web URL
- Multiple URL pasting with batch processing
- Automatic broken link detection and removal
- Dashboard notifications for removed broken links
- Standard error handling for invalid URLs

#### Discovery & Sharing
- Explore page showing popular lists ranked by total views
- Basic search functionality (lists by title/emoji, user profiles)
- User profiles displaying public lists and basic info
- One-click link copying for sharing lists
- Public user profiles with verification badges for connected socials

#### Monetization
- Stripe payment integration
- Per-list pricing (one-time payment for permanent access)
- Paywall preview (first 3 links visible, rest blurred)
- Dynamic pricing changes allowed by creators

#### Analytics Dashboard
- List view counts
- Link click tracking
- Bookmark counts per list
- Revenue tracking for paid lists
- Creator-only visibility for all analytics

#### User Profiles
- Public profiles showing:
  - Display name and username
  - Join date and list count
  - All public lists
  - Connected social accounts (Twitter, Instagram) with verification
- Profile editing capabilities

### Technical Requirements

#### Performance & UX
- Mobile-responsive design (web-only for V1)
- Smooth drag-and-drop interactions
- Loading states for metadata fetching
- Standard empty states and error handling
- Real-time updates for list changes

#### Data Management
- Automatic broken link detection and cleanup
- Metadata caching for faster loading
- Email notifications for important updates
- No dark mode support

#### Payment Processing
- Secure Stripe integration for all transactions
- Permanent access model for purchased lists
- Revenue tracking and payout management

## User Stories

### Content Creator Stories
- As a creator, I want to quickly add multiple links at once so I can build lists efficiently
- As a creator, I want to see detailed analytics on my lists so I can understand what content resonates
- As a creator, I want to monetize my curated lists so I can earn from my curation work
- As a creator, I want to easily reorder my links so I can present them in the best sequence
- As a creator, I want broken links automatically removed so my lists stay high-quality

### Consumer Stories
- As a user, I want to discover popular lists so I can find valuable curated content
- As a user, I want to bookmark interesting lists so I can return to them later
- As a user, I want to preview paid lists before purchasing so I know what I'm buying
- As a user, I want to search for specific topics so I can find relevant lists quickly
- As a user, I want to explore creator profiles so I can find more content from people I like

## Success Metrics

### Engagement Metrics
- Number of lists created per user
- Average links per list
- List view and click-through rates
- User retention (7-day, 30-day)

### Discovery Metrics
- Search usage and success rates
- Explore page engagement
- Profile view rates
- List bookmark rates

### Monetization Metrics
- Conversion rate from free to paid lists
- Average revenue per creator
- Payment completion rates
- Creator retention and earnings growth

## Future Considerations (Post-V1)

### Planned Features
- React Native mobile app
- Custom domain support for lists
- List collaboration (multiple owners)
- Advanced categorization and folders
- Embedded list widgets
- Enhanced discovery algorithms

### Potential Features
- List duplication functionality
- Advanced analytics and insights
- Creator subscription models
- Bulk link upload via file import
- API access for third-party integrations

## Design System & Styling

### Typography
Use **Open Runde** as the primary font for the entire platform. Open Runde is a modern, rounded sans-serif font that provides a friendly yet professional appearance with excellent readability across all devices and screen sizes.

Font source: https://github.com/lauridskern/open-runde

Implement the following font weights:
- 400 (Regular) - for body text
- 500 (Medium) - for emphasis
- 600 (Semibold) - for headings and important UI elements
- 700 (Bold) - for primary headings and CTAs

### UI Components
For consistent styling and rapid development, implement shadcn/ui components with a custom theme. Use the following command to install with a pre-configured theme:

```bash
npx shadcn@latest add https://tweakcn.com/r/themes/cmb5ezhpl000304kz0q1ea42g
```

This theme configuration provides a cohesive color palette and component styling that aligns with modern content creation platforms.

## Technical Constraints

- Lists limited to 100 links maximum
- Users limited to 100 lists maximum
- Web links only (no file uploads or other content types)
- No offline functionality required
- Email notifications only (no in-app notifications)

## MVP Definition

The minimum viable product should include:
1. User authentication (email + Google)
2. Basic list creation and link management
3. Simple discovery via Explore page
4. Core sharing functionality
5. Basic monetization with Stripe
6. Essential analytics for creators

This MVP allows creators to build, share, and monetize link collections while providing users with a way to discover and save valuable curated content.