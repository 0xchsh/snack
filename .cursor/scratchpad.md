## [Planner Mode Active - Updated Analysis]

## Background and Motivation

Snack aims to provide a standardized, beautiful, and easy-to-use platform for creating and sharing curated lists of links. The MVP will focus on enabling creators to quickly build, customize, and share lists, with features for authentication, public profiles, list management, link previews, basic customization, payments, and sharing. The product is positioned as a visually appealing, no-code alternative to DIY solutions, targeting creators and consumers who want to curate and discover content efficiently.

**NEW FEATURE REQUEST: User Profile Management Page**
The user has requested a comprehensive user profile page where authenticated users can manage their account settings including:
- Username management with availability validation (max 16 characters)
- Email address updates
- Display name changes  
- Account deletion functionality

This feature will enhance user account management and prepare the platform for public profile features.

## Current Project State Assessment (January 2025)

### ✅ **COMPLETED FOUNDATION** 
The project has achieved a **remarkably complete MVP state** with the following implemented features:

**Core Infrastructure:**
- ✅ Next.js 15 with App Router, TypeScript, TailwindCSS
- ✅ Clerk authentication (sign-in, sign-up, user management)
- ✅ Supabase PostgreSQL database with Prisma ORM
- ✅ Complete database schema (User, List, ListItem with all necessary fields)
- ✅ Database connectivity issues resolved with keep-alive system

**Core Features (Fully Functional):**
- ✅ User dashboard with list management
- ✅ List creation with instant navigation and inline editing
- ✅ Rich link management with OG data fetching
- ✅ Favicon integration with Google's favicon service
- ✅ Drag & drop reordering with optimistic updates
- ✅ Multiple link addition support (batch processing)
- ✅ Link deletion with confirmation dialogs
- ✅ Emoji picker for list customization
- ✅ Responsive design with modern UI components

**Technical Excellence:**
- ✅ Comprehensive API endpoints for all CRUD operations
- ✅ Proper error handling and loading states
- ✅ Type safety with TypeScript and Prisma
- ✅ Modern React patterns (Server Components, Client Components)
- ✅ Optimistic UI updates for better UX
- ✅ Security with Clerk middleware protection

### 🔍 **CURRENT STATUS: MVP COMPLETE - READY FOR NEXT PHASE**

The project has successfully completed the **core MVP functionality**. All essential features for a link curation platform are implemented and working. The database connectivity crisis has been resolved with an automated keep-alive system.

## Key Challenges and Analysis

**RESOLVED:**
- ✅ Authentication Integration (Clerk fully working)
- ✅ Database connectivity and stability
- ✅ List and Link Management (comprehensive CRUD)
- ✅ OG Data Fetching (reliable with error handling)
- ✅ Core UI/UX (modern, responsive, intuitive)

**REMAINING OPPORTUNITIES:**
- **Public Sharing & SEO**: Public list URLs, social media previews, SEO optimization
- **Advanced Customization**: Layout templates, themes, backgrounds
- **Analytics & Insights**: View tracking, link performance, user analytics
- **Payments Integration**: Stripe for premium features
- **Performance Optimization**: Caching, CDN, edge functions
- **Testing Coverage**: Comprehensive test suite
- **Production Readiness**: Monitoring, error tracking, deployment optimization

## High-level Task Breakdown - Next Phase

## **UPDATED PRIORITIES: Core Platform First** 🎯

**User Decision:** Focus on public sharing and user profiles before implementing payments. Build stable foundation first, then add monetization.

**Strategic Rationale:**
- ✅ **Nail core experience** before adding complexity
- ✅ **Public sharing drives growth** and user acquisition  
- ✅ **User profiles enable discovery** and network effects
- ✅ **Stable platform** before handling money

## **SHARING FEATURE REQUIREMENTS** 📋

**Two Button Pattern:**

1. **"View List" Button** 👁️
   - **Visibility:** Only shown to list owner when viewing/editing their own list
   - **Behavior:** Opens public list URL in new tab
   - **Purpose:** Let owners preview how their list looks to the public

2. **"Share Snack" Button** 📋
   - **Visibility:** Shown to everyone (owners and visitors)
   - **Behavior:** Copies public list URL to clipboard
   - **Purpose:** Easy sharing to social media, messaging, etc.

**Implementation Details:**
```typescript
// For list owners only
<Button onClick={() => window.open(publicUrl, '_blank')}>
  👁️ View List
</Button>

// For everyone
<Button onClick={() => copyToClipboard(publicUrl)}>
  📋 Share Snack
</Button>
```

**Public URL Format:** `/[username]/[listId]`

**Simple Tasks:**
1. **Public List Routes**
   - [ ] Create `/[username]/[listId]` public view pages
   - [ ] Make lists viewable without authentication
   - [ ] Handle non-existent lists gracefully

2. **Button Implementation**
   - [ ] Add "View List" button (owner only, opens in new tab)
   - [ ] Add "Share Snack" button (everyone, copies to clipboard)
   - [ ] Show "Link copied!" confirmation message

3. **Basic Meta Tags**
   - [ ] Add basic Open Graph tags so links preview nicely
   - [ ] Include list title, description, and emoji in previews

**Success Criteria:**
- List owners can preview their public list in a new tab
- Anyone can copy the list URL to share it
- Shared URLs work for anyone (no login required)
- Links look decent when pasted in social media/messaging

**Timeline:** 1 week for both sharing features

## **SIMPLIFIED IMMEDIATE PRIORITIES**

### **PHASE 1: Basic Public Sharing** 📋
**Goal:** Enable users to copy and share list URLs

**Simple Tasks:**
1. **Public List Routes**
   - [ ] Create `/[username]/[listId]` public view pages
   - [ ] Make lists viewable without authentication
   - [ ] Handle non-existent lists gracefully

2. **Copy Link Button**
   - [ ] Add "Share" or "Copy Link" button to list views
   - [ ] Implement clipboard copy functionality
   - [ ] Show "Link copied!" confirmation message

3. **Basic Meta Tags**
   - [ ] Add basic Open Graph tags so links preview nicely
   - [ ] Include list title, description, and emoji in previews

**Success Criteria:**
- Any user can click "Copy Link" and share a list URL
- Shared URLs work for anyone (no login required)
- Links look decent when pasted in social media/messaging

**Timeline:** 1 week for basic sharing functionality

### **PHASE 2: User Profiles** 👤
**Goal:** Enable creator discovery

**Tasks:**
1. **Public Profile Pages**
   - [ ] Create `/[username]` profile routes
   - [ ] Display user's public lists
   - [ ] Basic user information display

**Timeline:** 1 week for basic profiles

This is much more achievable and gets us the core value quickly! 🚀

### **PHASE 3: ENHANCED SHARING** 📱
**Goal:** Optimize for mobile and social platforms

**Tasks:**
1. **Mobile Optimization**
   - [ ] Ensure public pages are mobile-responsive
   - [ ] Optimize loading speeds for shared links
   - [ ] Test social media preview rendering

2. **Analytics Foundation**
   - [ ] Add basic view tracking for public lists
   - [ ] Track share button clicks
   - [ ] Simple analytics dashboard for creators

**Success Criteria:**
- Public lists load fast and look great when shared
- Users can discover each other through profiles
- SEO-optimized pages rank well in search
- Social media previews are compelling

**Timeline:** 2-3 weeks for core public sharing features

### **FUTURE PHASES (After Core Platform):**

### **IMMEDIATE: User Profile Management Page** 👤
**Goal:** Enable comprehensive user account management and prepare for public profile features

**User Requirements:**
- Username management with availability validation (max 16 characters)
- Email address updates
- Display name changes
- Account deletion functionality

**Technical Analysis:**
- Clerk handles email/name updates through their API
- Username requires custom validation and database updates
- Account deletion needs cascade handling for lists and items
- Form validation and error handling required

**Phase 1 Tasks:**

1. **Database Schema Analysis & Updates**
   - [ ] Verify current User model fields and constraints
   - [ ] Add username uniqueness validation at database level
   - [ ] Plan cascade deletion strategy for user accounts
   - [ ] Test Clerk user sync with database updates

2. **API Endpoints Development**
   - [ ] Create `/api/user/check-username` for availability validation
   - [ ] Create `/api/user/update-profile` for username/name updates
   - [ ] Create `/api/user/delete-account` with cascade deletion
   - [ ] Implement rate limiting for username checks

3. **UI Components & Forms**
   - [ ] Create profile settings page layout
   - [ ] Build username input with real-time validation
   - [ ] Build email/name update forms with Clerk integration
   - [ ] Create account deletion confirmation flow
   - [ ] Add loading states and error handling

4. **Validation & Security**
   - [ ] Implement username validation (length, characters, uniqueness)
   - [ ] Add proper error messages and user feedback
   - [ ] Secure API endpoints with authentication
   - [ ] Test edge cases and error scenarios

5. **Integration & Testing**
   - [ ] Sync username changes with Clerk metadata
   - [ ] Test email/name updates through Clerk API
   - [ ] Verify account deletion removes all associated data
   - [ ] End-to-end testing of all profile features

**Success Criteria:**
- Users can change username with real-time availability feedback
- Email and name updates work seamlessly through Clerk
- Account deletion removes all user data safely
- Form validation provides clear error messages
- All changes reflect immediately in the UI
- Mobile-responsive profile management interface

**Technical Considerations:**
- Username changes may affect public profile URLs (future feature)
- Clerk user metadata sync for username storage
- Database transactions for account deletion cascade
- Debounced username availability checking
- Proper error boundaries and fallback states

**Timeline:** 1 week for complete user profile management feature

### **PHASE 2: Payment System Implementation** 💰
**Goal:** Enable creators to sell their lists with 10% platform commission

**Phase 1 Tasks:**
1. **Database Schema Updates**
   - [ ] Add pricing fields to List model (isPaid, price)
   - [ ] Create ListPurchase model for tracking sales
   - [ ] Add Stripe account fields to User model

2. **Stripe Integration**
   - [ ] Set up Stripe Connect for creator payouts
   - [ ] Implement checkout flow with 10% commission
   - [ ] Create webhook handlers for payment confirmation
   - [ ] Build creator onboarding for payment setup

3. **UI/UX Implementation**
   - [ ] Add pricing controls to list creation/editing
   - [ ] Build "Buy Access" flow for paid lists
   - [ ] Create creator earnings dashboard
   - [ ] Add payment status indicators

4. **Testing & Validation**
   - [ ] Test complete payment flow end-to-end
   - [ ] Verify commission calculations
   - [ ] Test creator payout process
   - [ ] Mobile payment optimization

**Success Criteria:**
- Creators can set list prices and receive 90% of sales
- Buyers can purchase list access seamlessly
- Platform automatically collects 10% commission
- All payments are secure and PCI compliant

**Timeline:** 2-3 weeks for MVP payment system

### **Future Pro Features (To Be Determined):**
*Keep in mind for future subscription tier:*
- Custom domains
- Advanced analytics
- Custom CSS/themes
- Bulk management tools
- Priority support
- Reduced commission (8%)

**IMMEDIATE (Next 1-2 weeks):**
- [ ] **Public List Sharing** — Enable public URLs for lists
- [ ] **SEO & Social Media Integration** — Meta tags, OG cards, sharing
- [ ] **User Profiles** — Public profile pages

**SHORT TERM (Next month):**
- [ ] **Analytics Foundation** — Basic view tracking
- [ ] **Layout Templates** — Grid/list view options
- [ ] **Testing Suite** — Comprehensive test coverage

**MEDIUM TERM (Next quarter):**
- [ ] **Payments Integration** — Stripe for premium features
- [ ] **Advanced Customization** — Themes, backgrounds
- [ ] **Performance Optimization** — Caching, CDN

## Executor's Feedback or Assistance Requests

**🎉 MAJOR MILESTONE ACHIEVED**: The Snack AI project has successfully completed its **core MVP functionality**! 

**Current State Summary:**
- ✅ **Fully functional link curation platform**
- ✅ **Modern, responsive UI with excellent UX**
- ✅ **Robust backend with proper error handling**
- ✅ **Database connectivity issues resolved**
- ✅ **All core features working as intended**

**Recommended Next Steps:**
1. **User Testing**: Deploy current version and gather user feedback
2. **Public Sharing**: Implement public list URLs for viral growth
3. **SEO Optimization**: Add meta tags and social media integration
4. **Analytics**: Track usage patterns and user behavior

**Technical Debt Assessment**: **LOW** - Code quality is high, architecture is solid, no critical issues blocking progress.

**Deployment Readiness**: **HIGH** - Current version is production-ready for initial user testing.

## [Planner Mode Active - Monetization Strategy Analysis]

## Background and Motivation

Snack aims to provide a standardized, beautiful, and easy-to-use platform for creating and sharing curated lists of links. With the MVP complete, we need to establish a sustainable monetization strategy that balances user growth, creator earnings, and platform profitability.

## Monetization Strategy Analysis

### **Current Market Research**

**Gumroad Model (Reference Point):**
- ✅ **Free to use** - No monthly/setup fees
- ✅ **Commission-only** - 10% on direct sales
- ✅ **Low barrier to entry** - Creators start immediately
- ✅ **Scales with success** - Platform grows with creators

**Competitor Analysis:**
- **Linktree**: Free + $5-24/month for pro features
- **Beacons**: Free + $8-25/month tiers
- **Stan Store**: $29/month flat fee
- **ConvertKit**: $29-79/month for creators
- **Substack**: 10% commission on paid subscriptions

### **Monetization Models for Snack**

## **CONFIRMED STRATEGY: Pure Commission Model** ✅

**User Decision:** Start with pure commission model (10% on sales), no subscription fees. Future pro features will be determined based on user feedback and feature development.

**Strategic Benefits:**
- ✅ **Zero barriers** to creator adoption
- ✅ **Aligned incentives** - platform grows with creator success  
- ✅ **Market validation** before adding complexity
- ✅ **Creator-friendly positioning** vs. competitors

## **NEXT PHASE PRIORITIES** 🎯

### **IMMEDIATE: User Profile Management Page** 👤
**Goal:** Enable comprehensive user account management and prepare for public profile features

**User Requirements:**
- Username management with availability validation (max 16 characters)
- Email address updates
- Display name changes
- Account deletion functionality

**Technical Analysis:**
- Clerk handles email/name updates through their API
- Username requires custom validation and database updates
- Account deletion needs cascade handling for lists and items
- Form validation and error handling required

**Phase 1 Tasks:**

1. **Database Schema Analysis & Updates**
   - [ ] Verify current User model fields and constraints
   - [ ] Add username uniqueness validation at database level
   - [ ] Plan cascade deletion strategy for user accounts
   - [ ] Test Clerk user sync with database updates

2. **API Endpoints Development**
   - [ ] Create `/api/user/check-username` for availability validation
   - [ ] Create `/api/user/update-profile` for username/name updates
   - [ ] Create `/api/user/delete-account` with cascade deletion
   - [ ] Implement rate limiting for username checks

3. **UI Components & Forms**
   - [ ] Create profile settings page layout
   - [ ] Build username input with real-time validation
   - [ ] Build email/name update forms with Clerk integration
   - [ ] Create account deletion confirmation flow
   - [ ] Add loading states and error handling

4. **Validation & Security**
   - [ ] Implement username validation (length, characters, uniqueness)
   - [ ] Add proper error messages and user feedback
   - [ ] Secure API endpoints with authentication
   - [ ] Test edge cases and error scenarios

5. **Integration & Testing**
   - [ ] Sync username changes with Clerk metadata
   - [ ] Test email/name updates through Clerk API
   - [ ] Verify account deletion removes all associated data
   - [ ] End-to-end testing of all profile features

**Success Criteria:**
- Users can change username with real-time availability feedback
- Email and name updates work seamlessly through Clerk
- Account deletion removes all user data safely
- Form validation provides clear error messages
- All changes reflect immediately in the UI
- Mobile-responsive profile management interface

**Technical Considerations:**
- Username changes may affect public profile URLs (future feature)
- Clerk user metadata sync for username storage
- Database transactions for account deletion cascade
- Debounced username availability checking
- Proper error boundaries and fallback states

**Timeline:** 1 week for complete user profile management feature

### **PHASE 2: Payment System Implementation** 💰
**Goal:** Enable creators to sell their lists with 10% platform commission

**Phase 1 Tasks:**
1. **Database Schema Updates**
   - [ ] Add pricing fields to List model (isPaid, price)
   - [ ] Create ListPurchase model for tracking sales
   - [ ] Add Stripe account fields to User model

2. **Stripe Integration**
   - [ ] Set up Stripe Connect for creator payouts
   - [ ] Implement checkout flow with 10% commission
   - [ ] Create webhook handlers for payment confirmation
   - [ ] Build creator onboarding for payment setup

3. **UI/UX Implementation**
   - [ ] Add pricing controls to list creation/editing
   - [ ] Build "Buy Access" flow for paid lists
   - [ ] Create creator earnings dashboard
   - [ ] Add payment status indicators

4. **Testing & Validation**
   - [ ] Test complete payment flow end-to-end
   - [ ] Verify commission calculations
   - [ ] Test creator payout process
   - [ ] Mobile payment optimization

**Success Criteria:**
- Creators can set list prices and receive 90% of sales
- Buyers can purchase list access seamlessly
- Platform automatically collects 10% commission
- All payments are secure and PCI compliant

**Timeline:** 2-3 weeks for MVP payment system

### **Future Pro Features (To Be Determined):**
*Keep in mind for future subscription tier:*
- Custom domains
- Advanced analytics
- Custom CSS/themes
- Bulk management tools
- Priority support
- Reduced commission (8%)

## **MODEL 2: Freemium + Commission Hybrid** 💎
**Alternative Strategy for Faster Revenue**

### **Free Tier:**
- ✅ **Unlimited public lists**
- ✅ **Basic customization** (emojis, simple themes)
- ✅ **Up to 3 paid lists** per month
- ✅ **Standard analytics**
- ✅ **10% commission** on sales

### **Pro Tier ($8/month):**
- ✅ **Unlimited paid lists**
- ✅ **Advanced customization** (custom CSS, themes, backgrounds)
- ✅ **Detailed analytics** (conversion rates, traffic sources)
- ✅ **Custom domains** (yourname.com instead of snack.ai/yourname)
- ✅ **Priority support**
- ✅ **Reduced commission** (8% instead of 10%)
- ✅ **Early access** to new features

### **Revenue Projections:**
```
Scenario: 1,000 creators
- 800 free users: $0 subscription + 10% commission
- 200 pro users: $1,600/month subscription + 8% commission

Monthly Subscription Revenue: $1,600
Monthly Commission Revenue: ~$1,800 (estimated)
Total Monthly Revenue: $3,400
Annual Revenue: $40,800

Scale Scenario: 10,000 creators (20% pro adoption)
- 8,000 free users
- 2,000 pro users: $16,000/month subscription

Monthly Revenue: $16,000 + commission
Annual Revenue: $192,000 + commission
```

---

## **MODEL 3: Premium Platform** 👑
**Higher Revenue, Smaller Market**

### **Pricing:**
- **Starter**: $15/month - Basic features, 5% commission
- **Pro**: $29/month - Advanced features, 3% commission  
- **Enterprise**: $99/month - White-label, 0% commission

### **Target Market:**
- Established creators with existing audiences
- Businesses using lists for lead generation
- Agencies managing multiple creator accounts

---

## **Recommended Strategy: MODEL 1 with Future MODEL 2**

### **Phase 1: Launch with Pure Commission (0-12 months)**
**Rationale:** Maximize adoption and creator acquisition

- ✅ **Free platform access**
- ✅ **10% commission on sales**
- ✅ **Focus on creator success and platform growth**
- ✅ **Build network effects and viral growth**

### **Phase 2: Introduce Pro Tier (12+ months)**
**Rationale:** Monetize power users while keeping free tier

- ✅ **Keep free tier unchanged** (maintain growth)
- ✅ **Add $8/month Pro tier** with advanced features
- ✅ **Reduce Pro commission to 8%** (incentive to upgrade)
- ✅ **Target: 15-25% pro adoption rate**

## **Feature Differentiation Strategy**

### **Free Tier Features:**
- Unlimited public lists
- Basic list customization (emojis, simple themes)
- Up to 5 paid lists per month
- Basic analytics (views, sales)
- Standard support
- 10% commission

### **Pro Tier Features ($8/month):**
- Everything in Free
- Unlimited paid lists
- Advanced customization (custom CSS, backgrounds, layouts)
- Custom domains (yourname.com)
- Detailed analytics (conversion funnels, traffic sources, A/B testing)
- Priority support
- Early access to features
- 8% commission (2% savings)
- Bulk list management tools
- Team collaboration features

### **Enterprise Features (Custom Pricing):**
- White-label platform
- Custom integrations
- Dedicated account manager
- SLA guarantees
- Advanced security features

## **Pricing Psychology & Positioning**

### **$8/month Pro Tier Justification:**
- **Below Linktree Pro** ($5-24 range)
- **Matches Beacons entry** ($8 tier)
- **Significant value** for 2% commission reduction
- **Psychological sweet spot** - not too cheap (low value perception) or expensive (barrier)

### **Commission Rate Rationale:**
- **10% matches Gumroad** (industry standard)
- **Lower than Substack** (10% but different model)
- **Competitive with app stores** (Apple/Google 30%, but different scale)
- **Fair value exchange** for platform, payment processing, hosting

## **Revenue Optimization Strategies**

### **Creator Success = Platform Success:**
1. **Creator Education**: Courses on list monetization
2. **Marketing Tools**: Built-in promotion features
3. **Analytics**: Help creators optimize conversion
4. **Community**: Creator networking and collaboration
5. **Templates**: Proven list formats and pricing strategies

### **Conversion Optimization:**
1. **Free Trial**: 30-day Pro trial for new creators
2. **Usage-Based Upgrades**: Prompt when hitting free limits
3. **Success-Based Upgrades**: Offer Pro when earnings reach threshold
4. **Annual Discounts**: $80/year (2 months free) for Pro

### **Additional Revenue Streams (Future):**
1. **Featured Listings**: Pay for homepage promotion
2. **Premium Templates**: Paid design templates
3. **Advanced Analytics**: Detailed creator insights
4. **API Access**: For enterprise integrations
5. **Certification Programs**: Paid creator courses

## **Competitive Positioning**

### **vs. Gumroad:**
- ✅ **Better UX**: Modern, mobile-first design
- ✅ **Specialized**: Built specifically for curated lists
- ✅ **Social Features**: Discovery and sharing built-in
- ✅ **Same Commission**: 10% competitive rate

### **vs. Linktree:**
- ✅ **Monetization Focus**: Built for selling, not just linking
- ✅ **Better Content**: Rich previews and curation tools
- ✅ **Commission Model**: Pay only when you earn

### **vs. Substack:**
- ✅ **Lower Barrier**: Lists vs. full newsletters
- ✅ **One-time Payments**: No subscription management complexity
- ✅ **Visual Focus**: Better for visual/link content

## **Implementation Priority**

### **Immediate (Phase 1 - Pure Commission):**
1. **Payment Processing**: Stripe integration with 10% commission
2. **Creator Onboarding**: Stripe Connect for payouts
3. **Basic Analytics**: Sales tracking and reporting
4. **Pricing UI**: Set list prices, payment flows

### **Short-term (3-6 months):**
1. **Enhanced Analytics**: Conversion tracking, traffic sources
2. **Creator Tools**: Promotion features, sharing tools
3. **Mobile Optimization**: Payment flows on mobile
4. **Creator Support**: Help docs, best practices

### **Medium-term (6-12 months):**
1. **Pro Tier Development**: Advanced features
2. **Custom Domains**: Technical infrastructure
3. **Advanced Customization**: CSS editor, themes
4. **A/B Testing**: For creators to optimize

## **Success Metrics**

### **Phase 1 Targets (12 months):**
- **1,000+ active creators**
- **$50,000+ monthly GMV**
- **$5,000+ monthly platform revenue**
- **15%+ creator retention rate**

### **Phase 2 Targets (24 months):**
- **5,000+ active creators**
- **20%+ Pro tier adoption**
- **$250,000+ monthly GMV**
- **$30,000+ monthly platform revenue**

## **Risk Mitigation**

### **Creator Churn Prevention:**
- **Success Coaching**: Help creators optimize earnings
- **Community Building**: Creator networking events
- **Feature Requests**: Rapid response to creator needs
- **Transparent Communication**: Clear roadmap and updates

### **Competition Response:**
- **Feature Velocity**: Rapid development and deployment
- **Creator Lock-in**: Build switching costs through success
- **Network Effects**: Creator discovery and collaboration
- **Brand Building**: Become synonymous with list monetization

## **Recommendation: Start with MODEL 1**

**Rationale:**
1. **Fastest Growth**: No barriers to creator adoption
2. **Market Validation**: Prove demand before adding complexity
3. **Creator Success**: Focus on helping creators earn
4. **Competitive**: Matches successful platforms like Gumroad
5. **Scalable**: Foundation for future premium features

**Next Steps:**
1. Implement Stripe integration with 10% commission
2. Build creator onboarding and payout systems
3. Launch with pure commission model
4. Gather creator feedback and usage data
5. Plan Pro tier features based on creator requests

This strategy positions Snack as the "Gumroad for curated lists" with potential to evolve into a comprehensive creator platform.

## CRITICAL ISSUE: Prisma Database Connectivity Problem

### Problem Analysis
The application is experiencing persistent database connectivity issues with Supabase, manifesting in multiple ways:

1. **Primary Issue**: `Can't reach database server at aws-0-us-east-2.pooler.supabase.com:5432`
2. **Prisma Studio Error**: Complex runtime error in Prisma Studio suggesting client initialization problems
3. **Database URL Format Issue**: The DATABASE_URL in .env file has a line break, making it invalid
4. **Supabase Free Tier Behavior**: Database instances pause after inactivity and require manual wake-up

### Root Cause Analysis
Based on the error patterns and Prisma documentation:

1. **Invalid DATABASE_URL**: The connection string is split across multiple lines in the .env file
2. **Supabase Pooler Issues**: Using connection pooling URL that may have stability issues on free tier
3. **Prisma Client Generation**: May need regeneration after connection string fixes
4. **Database Sleep State**: Supabase free tier databases pause and need manual activation

### Impact Assessment
- **High**: Prisma Studio completely non-functional
- **High**: Database operations in the application failing intermittently
- **Medium**: Development workflow severely impacted
- **Low**: Production readiness compromised

## Key Challenges and Analysis
- **Authentication Integration**: Implementing Clerk for seamless social login and account management.
- **OG Data Fetching**: Reliably scraping and displaying Open Graph data for links in real time.
- **List and Link Management**: Supporting unlimited lists and links per user, with manual ordering and metadata editing.
- **Payments**: Integrating Stripe for paywalls and one-time payments.
- **Customization**: Allowing users to personalize lists with emojis, backgrounds, and layout templates.
- **SEO & Sharing**: Ensuring public URLs are SEO-friendly and support rich previews on social platforms.
- **Security**: Protecting user data and sessions, and preventing common web vulnerabilities.
- **Scalability**: Designing the backend and database to support growth and future features (analytics, custom domains, etc.).
- **Database Connectivity**: **[NEW CRITICAL]** Ensuring stable, reliable database connections for development and production environments.

## Stack Audit & Recommendations (Optimized Rebuild)

### Current Stack (from v1)
- **Frontend:** Next.js (React, App Router), TailwindCSS, ShadCN UI
- **Backend/API:** Next.js API routes, Prisma ORM, PostgreSQL (Vercel-hosted)
- **Auth:** Clerk (prebuilt UI, user management, secure, generous free tier, replaces Privy/Auth.js)
- **Payments:** Stripe
- **State Management:** Zustand
- **Testing:** Jest, React Testing Library, Playwright
- **Styling:** TailwindCSS
- **Deployment:** Vercel
- **Other:** Open Graph scraping, SEO meta, analytics (Plausible), emoji picker, drag-and-drop

### Audit & Optimization Recommendations
- **Frontend:**
  - Keep Next.js (latest LTS, App Router, server components, edge functions)
  - Continue with TailwindCSS and ShadCN for rapid, modern UI
  - Use React Server Components and Suspense for performance
  - Optimize images with Next.js Image component and CDN
  - Use free analytics (Plausible is paid; consider Umami or self-hosted Plausible for free)
- **Backend/API:**
  - Keep Prisma ORM for type safety and productivity
  - Use PostgreSQL (prefer free tier, e.g., Railway, Supabase, Neon)
  - Consider moving API logic to /api or server actions for clarity
  - Use edge functions for latency-sensitive endpoints
- **Auth:**
  - Use Clerk for authentication and user management (prebuilt UI, secure, easy integration with Next.js, free tier)
  - Implement Clerk's session management and protect API endpoints with Clerk middleware
- **Payments:**
  - Stripe is industry standard; keep for now
  - Use test mode for dev, and only enable live keys in production
- **State Management:**
  - Zustand is lightweight and modern; keep
  - Use React context for global, non-complex state
- **Testing:**
  - Keep Jest, React Testing Library, Playwright
  - Add more integration and e2e tests for critical flows
- **Styling:**
  - Continue with TailwindCSS, use CSS modules for component-specific styles if needed
- **Deployment:**
  - Vercel is optimal for Next.js; use free tier for dev/staging
  - Use Vercel's built-in Postgres or connect to external free Postgres
- **Other:**
  - Use open-source emoji picker (e.g., emoji-picker-react)
  - Use react-beautiful-dnd or dnd-kit for drag-and-drop (both free)
  - Use Next.js built-in SEO utilities for meta tags
  - Use .env for all secrets, never commit secrets
  - Audit dependencies for security and remove unused packages

## Optimization Principles
- **Performance:** SSR/SSG where possible, edge functions, CDN for assets, lazy load images/components
- **Security:** Validate all inputs, use secure cookies, protect API endpoints, audit dependencies
- **Cost Efficiency:** Prefer open-source/free tools, use free hosting tiers, self-host analytics if needed
- **Developer Experience:** TypeScript everywhere, strict linting, Prettier, modular code, clear folder structure
- **Accessibility:** Use semantic HTML, test with screen readers, ensure color contrast
- **Scalability:** Modularize business logic, prepare for multi-region, use caching for heavy operations (e.g., OG scraping)

## High-level Task Breakdown (Optimized Rebuild)

### 1. Project Bootstrap & Tooling
- [ ] Initialize new Next.js (latest) project with TypeScript, App Router
- [ ] Set up TailwindCSS, ShadCN UI, Prettier, ESLint, Husky (pre-commit hooks)
- [ ] Set up Jest, React Testing Library, Playwright for testing
- [ ] Set up .env and example config
- [ ] Set up GitHub Actions for CI (lint, typecheck, test)

### 2. Database & ORM
- [ ] Set up PostgreSQL (prefer free tier: Railway, Supabase, Neon)
- [ ] Define schema with Prisma (users, lists, list items, payments, events, etc.)
- [ ] Set up Prisma migrations and seed scripts
- [ ] Add Prisma type safety to API

### 3. Authentication (Clerk)
- [ ] Integrate Clerk for authentication and user management (Next.js SDK)
- [ ] Use Clerk's prebuilt UI components for sign up, sign in, and profile management
- [ ] Implement Clerk's session management and protect API endpoints with Clerk middleware
- [ ] Ensure user data in DB is linked to Clerk user IDs

### 4. Core Features
- [ ] User dashboard (create/edit/delete lists)
- [ ] Public user profile pages (`/username`)
- [ ] List creation/editing (emoji, title, description, layout, background)
- [ ] Add/remove/reorder links in lists (drag-and-drop)
- [ ] OG data fetching for links (serverless function, cache results)
- [ ] Inline link preview cards (image, title, description)
- [ ] Editable link metadata
- [ ] List and link sharing (SEO meta, OG/Twitter cards, share buttons)

### 5. Customization
- [ ] Layout templates (grid, list)
- [ ] Emoji picker (open-source)
- [ ] Background color/image selection
- [ ] Dark mode (auto + toggle)

### 6. Payments
- [ ] Integrate Stripe (test mode for dev)
- [ ] Paywall for lists/links
- [ ] Stripe webhook handling (secure, idempotent)

### 7. Analytics
- [ ] Integrate free/self-hosted analytics (Umami, self-hosted Plausible)
- [ ] Track views, shares, CTR per link

### 8. Admin Dashboard
- [ ] Admin-only dashboard for user/list/link stats

### 9. Security & Best Practices
- [ ] Input validation (zod or similar)
- [ ] Secure cookies, CSRF/XSS protection
- [ ] Audit and update dependencies
- [ ] Add security headers (Next.js config)

### 10. Deployment & DevOps
- [ ] Set up Vercel for hosting (free tier for dev/staging)
- [ ] Configure custom domains, SSL
- [ ] Set up preview deployments for PRs

### 11. Documentation
- [ ] Update README with setup, env, and contribution guidelines
- [ ] Add API docs (OpenAPI or similar)

### 12. Testing & QA
- [ ] Write unit, integration, and e2e tests for all critical flows
- [ ] Manual QA for accessibility, mobile, and edge cases

---

**Success Criteria:**
- All MVP features from PRD are implemented with optimized, modern, and secure code
- App loads fast (<1s for main pages), is mobile responsive, and passes accessibility checks
- All critical flows are covered by automated tests
- No paid dependencies unless strictly required (auth, analytics, hosting all use free/open-source where possible; Clerk free tier is sufficient for MVP)
- Codebase is clean, modular, and easy to contribute to

## Project Status Board

### **COMPLETED MVP FEATURES** ✅
- [x] **Core Infrastructure** — Complete
- [x] **Authentication (Clerk)** — Complete  
- [x] **Database & ORM (Supabase + Prisma)** — Complete
- [x] **User Dashboard & List Management** — Complete
- [x] **Link Management with OG Data** — Complete
- [x] **Drag & Drop Reordering** — Complete
- [x] **Multiple Link Support** — Complete
- [x] **Emoji Picker Integration** — Complete
- [x] **Favicon Integration** — Complete
- [x] **Inline Editing** — Complete
- [x] **Delete Functionality** — Complete
- [x] **Database Connectivity Resolution** — Complete
- [x] **Production Deployment (Vercel)** — Complete

### **IMMEDIATE PRIORITY: User Profile Management** 👤
**Goal:** Enable comprehensive user account management functionality

#### ✅ **COMPLETED:**
- [x] Basic profile page structure and navigation
- [x] Profile picture upload with validation and error handling  
- [x] Email display logic (read-only for social auth users)
- [x] Account deletion functionality with confirmation
- [x] Form validation and error handling
- [x] **Username validation fix (JUST COMPLETED)**
  - Updated validation rules to 3-15 characters (was 16 max)
  - Changed to alphanumeric only (removed hyphens/underscores)
  - Fixed both frontend and API validation
  - Maintains username availability checking

#### 🔄 **IN PROGRESS:**
- [x] Testing username validation changes ✅
- [x] **Profile page tabs and logout (IN PROGRESS):**
  - Added logout functionality with Clerk signOut
  - Created tabs UI component manually 
  - Restructured profile page into "Profile" and "Settings" tabs
  - Installing required @radix-ui/react-tabs dependency

#### 📋 **NEXT TASKS:**
- [x] Complete tabs dependency installation
- [x] Test profile page tabs functionality
- [x] Test logout button functionality
- [x] Final testing of reorganized profile page

---

## Executor's Feedback or Assistance Requests

### **JUST COMPLETED: Username Validation Fix** ✅
**Task:** Fix username validation according to user requirements
**Status:** COMPLETED
**Changes Made:**
1. **Frontend validation (`profile-settings.tsx`):**
   - Changed length requirement from max 16 to 3-15 characters
   - Updated regex from `/^[a-zA-Z0-9_-]+$/` to `/^[a-zA-Z0-9]+$/` (alphanumeric only)
   - Removed separate start/end character validation (redundant with alphanumeric-only rule)
   - Updated error messages to be more user-friendly

2. **API validation (`check-username/route.ts`):**
   - Updated Zod schema to match frontend requirements
   - Fixed Prisma query by removing unsupported `mode: 'insensitive'` option
   - Maintained case-sensitive username checking

**Expected Behavior:**
- Username field should now properly validate "charles" (6 characters, alphanumeric)
- Should show "Username is available" or "Username is already taken" after API check
- Should reject usernames with spaces, hyphens, underscores, or special characters
- Should reject usernames shorter than 3 or longer than 15 characters

**Ready for Testing:** User can now test the username validation in the profile page.

### **NEXT STEPS:**
Need user to test the following scenarios:
1. Try typing "charles" - should work (no "Username is required" error)
2. Try typing "ab" - should show "Username must be at least 3 characters"  
3. Try typing "test_user" - should show "Username can only contain letters and numbers"
4. Try typing a very long username - should show "Username must be 15 characters or less"
5. Try typing an existing username - should show "Username is already taken"

**Request:** Please test the updated username validation and confirm it works as expected.

### **CURRENT STATUS: DATABASE CONNECTIVITY RESOLVED ON VERCEL, LOCAL DNS ISSUE REMAINS**

### ✅ **COMPLETED:**
1. **Identified Root Cause**: Missing `DATABASE_URL` environment variable in Vercel production
2. **Added DATABASE_URL**: Set Supabase pooler connection string for Production & Preview environments
3. **Successfully deployed**: New deployment triggered with correct database configuration

### 🚨 **CURRENT ISSUE: DNS Resolution Failure**
**Problem**: Local machine cannot resolve `*.supabase.co` hostnames
**Symptoms**: 
- `nslookup db.fwahxwlbsilzlbgeotyk.supabase.co` returns "No answer"
- Local development completely blocked
- Build failures due to DNS issues during `prisma generate`

**Error Pattern**:
```
Non-authoritative answer:
*** Can't find db.fwahxwlbsilzlbgeotyk.supabase.co: No answer
```

### 🔧 **IMMEDIATE NEXT STEPS:**
1. **USER ACTION REQUIRED**: Change DNS settings on Mac
   - System Settings → Network → Wi-Fi/Ethernet → Details → DNS
   - Replace current DNS with: `8.8.8.8`, `8.8.4.4` (Google DNS)
   - Alternative: `1.1.1.1`, `1.0.0.1` (Cloudflare DNS)

2. **After DNS Change**:
   - Test: `nslookup db.fwahxwlbsilzlbgeotyk.supabase.co`
   - Should return IP address instead of "No answer"
   - Run: `npx prisma migrate dev` locally
   - Test: `npm run dev` for local development

### 📊 **PRODUCTION STATUS:**
- ✅ **Environment Variables**: Correctly configured
- ✅ **Database URL**: Supabase pooler connection set
- ❓ **Deployment Status**: Build may be failing due to DNS issues
- ❓ **Runtime Status**: Need to verify after DNS fix

### 🎯 **SUCCESS CRITERIA:**
- [ ] DNS resolves Supabase hostnames
- [ ] Local `npx prisma migrate dev` succeeds
- [ ] Local app runs on `localhost:3000`
- [ ] Production deployment builds successfully
- [ ] Production app (`snack-ratlabs.vercel.app`) works without errors

## Lessons

- **Clerk Environment Variables:** Ensure `CLERK_SECRET_KEY` in `.env.local` is complete and not truncated during copy/paste. The `auth()` function requires this to validate sessions on the server-side.
- **Prisma Migrations:** After defining models in `schema.prisma`, always run `npx prisma migrate dev` to create the actual database tables.
- **Debugging API Routes:** Use server-side console.log statements to inspect authentication objects and database queries when troubleshooting 401/500 errors.
- **Alternative Auth Approach:** When `auth()` function has issues, `currentUser()` can be used as an alternative for authentication in API routes.
- **ShadCN UI Components:** Install components as needed (`npx shadcn@latest add card dialog input label textarea`) and use `--force` flag for React 19 compatibility.
- **Server vs Client Components:** Use server components for data fetching and authentication, client components for interactivity and state management.

### Planner Analysis: Next Foundational Piece

**Current State:**
- Next.js project scaffolded and running.
- TailwindCSS, ShadCN UI (button component added), Prettier installed, ESLint, Husky, and test tooling dependencies installed.
- Clerk authentication fully integrated and working.
- Supabase PostgreSQL database and Prisma ORM integration complete, with initial schema (User, List, ListItem) migrated.

**Outstanding from previous phase (Bootstrap & Tooling):**
- Prettier configuration (add `.prettierrc`).
- Sample test file for Jest/RTL/Playwright to verify test setup.

**Next Foundational Piece Recommendation:**

**Core Features: User Dashboard and List Creation & Management**
- **Rationale:** With authentication and the database in place, the next critical step is to enable users to interact with the core product. This involves creating a user dashboard where they can see their lists, and the UI and API functionality to create, view, edit, and delete these lists and their associated links. This forms the heart of the Snack application.
- **This includes:**
  - Designing and building the UI for a user dashboard.
  - Implementing API endpoints (e.g., using Next.js API routes or server actions) for:
    - Creating a new list (title, description, emoji). - *`POST /api/lists` implemented, needs testing.*
    - Fetching a user's lists.
    - Viewing a specific list.
    - Updating list metadata.
    - Deleting a list.
    - Adding links to a list.
    - Editing links in a list.
    - Reordering links.
    - Deleting links.
  - Connecting the dashboard UI to these API endpoints.
  - Ensuring new users in the database are correctly linked to their Clerk ID when they first interact with list creation or other features that require a DB user record.

**Proposed Next Tasks for Executor (in order):**
1.  **Complete Bootstrap & Tooling:**
    - Add Prettier configuration file (`.prettierrc`).
    - Create a sample test file to verify Jest/RTL setup.
2.  **Implement Core Features: User Dashboard and List Creation & Management (MVP)**
    - Create basic API endpoints for list CRUD (Create, Read-all-for-user, Read-one, Update, Delete).
    - Build a simple user dashboard page that lists the authenticated user's lists (if any) and a button to create a new list.
    - Build a form/modal to create a new list (title, description, emoji).

### Planner Analysis: Next Foundational Piece

**Current State:**
- Next.js project scaffolded and running
- TailwindCSS, ShadCN UI, Prettier, ESLint, Husky, and test tooling set up
- Clerk authentication fully integrated and working (sign in, sign up, user management)

**Next Foundational Piece Recommendation:**

**Database & ORM Integration**
- Rationale: Now that authentication is working, the next foundational step is to set up persistent data storage for users, lists, and links. This will enable all core features (list creation, user profiles, link management, payments, etc.) to be built on a solid, scalable backend.
- This includes:
  - Setting up PostgreSQL (preferably a free tier: Railway, Supabase, Neon, or local for dev)
  - Adding Prisma ORM to the project
  - Defining the initial schema (User, List, ListItem, etc.)
  - Running migrations and connecting the app to the database
  - Ensuring Clerk user IDs are linked to DB users

**Proposed Next Task for Executor:**
- Set up PostgreSQL and Prisma ORM
- Define and migrate the initial schema
- Test DB connection and Clerk user linkage 

## Current Status / Progress Tracking

- ✅ Root cause identified: Supabase database was missing and needed to be restored. Fixed.
- ✅ Dashboard UI updated to match Figma design.
- ❌ **NEW ISSUE**: List creation failing with 401 Unauthorized error.

### List Creation Debugging:
- API call returns: `HTTP/1.1 401 Unauthorized` with headers:
  - `x-clerk-auth-reason: dev-browser-missing`
  - `x-clerk-auth-status: signed-out`
- Root cause: Clerk authentication is failing on API requests from the browser.
- The user appears signed out to the Clerk middleware, even though they can access the dashboard.

## Executor's Feedback or Assistance Requests

**Issue:** User can access the dashboard (showing they're authenticated) but cannot create lists (API returns 401 Unauthorized).

**Immediate troubleshooting needed:**
1. Please check if you're actually signed in:
   - Look at the top-right corner of your dashboard - do you see your profile picture?
   - If not, please sign in again.
   
2. **Test authentication status:**
   - Open browser developer tools (F12)
   - Go to Application > Cookies
   - Look for any cookies with "clerk" in the name
   - Are there any clerk-related cookies present?

3. **Try refreshing and re-authenticating:**
   - Refresh the dashboard page
   - If you see any sign-in prompts, please complete them
   - Try creating a list again


**Root cause hypothesis:** The Clerk session may have expired or isn't being properly sent with API requests, causing authentication to fail even though the dashboard page loads (possibly cached).

## Background and Motivation

- The project is a Next.js app using Clerk for authentication and Supabase for the database.
- The user is unable to create a new list from the dashboard. The frontend shows: `Error: Failed to create list: {}`.
- The Supabase `users` table contains the correct Clerk user, so the foreign key should not be the issue.
- The API was updated to return real error messages, but the frontend still receives an empty error object.

## Key Challenges and Analysis

- **Silent API Failure:** The API is not returning a detailed error message to the frontend, even after updating error handling.
- **Possible Causes:**
  1. The error is not being thrown or caught as expected in the API route.
  2. There may be a serialization or response handling issue in Next.js API routes.
  3. There could be a network/proxy/middleware issue stripping the error message.
  4. The Supabase insert may be failing for a reason not visible in the current logs.
- **Observability Gap:** Lack of actionable error details is blocking root cause identification.

## High-level Task Breakdown

1. **Verify API Error Propagation**
   - Add explicit logging and test with a direct API call (e.g., curl/Postman) to confirm error details are returned in the response body.
   - Success: API returns a non-empty error message in the response body when a failure occurs.

2. **Check API Route and Middleware**
   - Review Next.js middleware and API route configuration for anything that could strip or mask error responses.
   - Success: Confirm error responses are not being altered by middleware.

3. **Test Database Insert Manually**
   - Use Supabase dashboard or SQL to manually insert a list row for the user. Note any errors (e.g., constraints, required fields).
   - Success: Manual insert works, or error message reveals the true constraint.

4. **Review Table Schema**
   - Check the `lists` table schema for required fields, constraints, or triggers that could block inserts.
   - Success: All required fields are being provided by the API request.

5. **Add Fallback Logging**
   - If error object is still empty, add a catch-all log to print the full error object and stack trace to the server console.
   - Success: Server logs reveal the true error.

6. **Update Error Handling for Observability**
   - Ensure all API errors are logged and returned in a way that survives Next.js serialization.
   - Success: Frontend receives actionable error details.

7. **Root Cause Remediation**
   - Once the true error is identified, fix the underlying issue (e.g., schema, data, code).
   - Success: List creation works and error handling is robust for future issues.

## Success Criteria
- Creating a list from the dashboard works without error.
- If an error occurs, the frontend receives a detailed, actionable error message.
- The root cause is documented in the Lessons section for future reference.

## Historical Context & Key Learnings

### 1. Migration & Planning ("Scan repo and plan next steps")
- The project migrated from Prisma/SQLite to Supabase for the database backend.
- The main goal was to modernize the stack and improve scalability and maintainability.
- Key migration steps included updating the ORM, database schema, and authentication integration.
- Early blockers included database connectivity issues, environment variable misconfigurations, and DNS resolution problems on local development.
- The project now uses Next.js (App Router), Clerk for authentication, Supabase for the database, and Prisma ORM for type safety.
- The MVP is now functionally complete, with all core features (auth, dashboard, CRUD, OG data, drag-and-drop, emoji picker, responsive UI, error handling, etc.) implemented and working.
- Technical debt is low, and the codebase is clean and modular.
- Deployment is on Vercel, with environment variables and database connectivity resolved.

### 2. Product Requirements & UI/UX ("Product Requirements Discussion for Snack")
- The user requested a more organized profile page, with tabs for personal information and settings.
- Tabs were implemented using @radix-ui/react-tabs, and logout functionality was added.
- The user expressed concern about losing lists and requested to revert changes and recover Supabase database information, indicating a shift in focus from UI improvements to data recovery.
- The project experienced a period of urgent troubleshooting and recovery, but the lists and user data were successfully restored.
- The user values rapid, clear communication and persistent context for future troubleshooting and planning.

### Key Lessons & Best Practices
- Always ensure foreign key relationships use the correct internal IDs (not external auth IDs) when inserting related records.
- Add robust error logging and return actionable error messages from API routes to speed up debugging.
- Maintain a persistent project scratchpad with historical context, key decisions, and lessons learned to avoid repeated context sharing and to accelerate onboarding and troubleshooting.

## Project Status Board
- [ ] Public Profile Page
  - [ ] Dynamic route for /[username]/
  - [ ] API endpoint to fetch user profile and public lists by username
  - [ ] Frontend: Display avatar, display name, username, stats, and grid of public lists
  - [ ] Share profile button
  - [ ] Design polish and responsiveness
  - [ ] SEO/meta tags
  - [ ] Edge case handling (no lists, user not found)

## Executor's Feedback or Assistance Requests
- Switching to Executor mode. Ready to begin with dynamic route setup for public profile pages.

## Background and Motivation
The goal is to enhance the user dashboard by adding clear, actionable stats (lists, saves, views, shares) to give users insight into their activity and engagement. This will improve user motivation, retention, and provide a more professional, data-driven experience.

## Key Challenges and Analysis
- **Data Sources:** Stats must be fetched from Supabase (or other sources) and may require aggregation (e.g., total saves, views, shares per user).
- **Performance:** Stats should load quickly and not block the dashboard UI.
- **Accuracy:** Ensure stats are up-to-date and reflect the user's real activity.
- **UI/UX:** Stats should be visually clear, match the design (see attached screenshot), and be easy to extend in the future.

## High-level Task Breakdown
1. **Database/Backend**
   - [ ] Identify or add columns/tables for saves, views, shares if not already present.
   - [ ] Write efficient queries to aggregate stats per user (lists count, saves, views, shares).
   - [ ] (Optional) Add API endpoint for fetching user stats if needed.

2. **Frontend Integration**
   - [ ] Update the dashboard page to fetch and display stats.
   - [ ] Implement stat cards for Lists, Saves, Views, Shares (matching design).
   - [ ] Add loading and error states for stats.

3. **Testing & Edge Cases**
   - [ ] Test with users with many/few/no lists, saves, views, shares.
   - [ ] Ensure stats update after user actions (e.g., creating a list, saving, sharing).

## Success Criteria
- Dashboard displays accurate, up-to-date stats for the logged-in user.
- Stats match the design and are visually clear.
- No significant performance impact on dashboard load.
- Handles edge cases (zero stats, errors) gracefully.

## Project Status Board
- [ ] Add user stats to dashboard (lists, saves, views, shares)
  - [ ] Backend: aggregate stats per user
  - [ ] Frontend: display stat cards in dashboard
  - [ ] Test and polish UI/UX

## Executor's Feedback or Assistance Requests
- Ready to proceed with backend data aggregation for user stats.

## Project Status Board
- [ ] Saved Lists Feature
  - [ ] Backend: `saved_lists` table and queries
  - [ ] Frontend: Save button and dashboard integration
  - [ ] Test and polish

## Executor's Feedback or Assistance Requests
- Switching to Executor mode. Ready to begin with backend table and queries for saved lists.

### Profile Page Tabs & Logout: User Confirmed Working ✅
- User tested the profile page tabs and logout functionality.
- Both features work as expected in the browser.
- Marking these tasks as complete in the Project Status Board.

## [New Request] Architectural Change: Migrate from Clerk to Supabase Auth

*This section addresses the user's request to evaluate migrating the application's authentication system from Clerk to native Supabase Auth.*

### Planner's Recommendation

**Recommendation: Postpone Migration.**

Before undertaking this significant architectural change, it is strongly recommended to **resolve the existing "Failed to create list" bug**. Migrating the authentication system now will introduce a large number of new variables, making it much more difficult to diagnose the original problem. A stable, working application is the ideal starting point for a migration of this scale.

### Motivation for Migration

- **Tighter Integration:** Using Supabase for both database and authentication simplifies the tech stack and allows for seamless integration with features like Row Level Security (RLS).
- **Consolidated Tooling:** Reduces reliance on a third-party service, centralizing user management within the Supabase ecosystem.
- **Potentially Simpler Backend Logic:** User identity is directly tied to the database, which can simplify data access policies.

### Impact Analysis

This is a major migration that will affect nearly every part of the application:

- **Backend:** All API routes currently protected by Clerk's middleware must be refactored. Logic for fetching the current user will change from `auth().userId` to a Supabase server client method.
- **Frontend:** All Clerk-provided UI components (`<UserButton>`, `<SignIn>`, `<SignUp>`) must be replaced with custom-built or Supabase-provided alternatives.
- **State Management:** Client-side hooks for accessing user data (`useUser`, `useAuth`) must be replaced with Supabase's client-side authentication library (`@supabase/auth-helpers-nextjs`).
- **Database:** The `profiles` table currently links to users via `clerk_id`. This schema must be migrated to link to Supabase's `auth.users` table. This will likely require recreating user accounts.

### High-level Migration Plan

#### Phase 1: Setup and Proof of Concept
*Goal: Verify that Supabase Auth can be integrated successfully in isolation.*
- **[ ] Task:** Create a new `feat/supabase-auth` git branch to isolate the work.
- **[ ] Task:** Install and configure `@supabase/auth-helpers-nextjs`.
- **[ ] Task:** Create new, simple sign-in and sign-up pages using Supabase.
- **[ ] Task:** Replace Clerk's `middleware.ts` with Supabase's session-handling middleware.
- **[ ] Task:** Create a test page and a test API route protected by the new Supabase Auth middleware to confirm it works end-to-end.
- **Success Criteria:** A user can sign up, sign out, and sign back in. Protected content is only visible to authenticated users.

#### Phase 2: Application-Wide Integration
*Goal: Replace all instances of Clerk with Supabase Auth across the entire application.*
- **[ ] Task:** Rewrite the main sign-in and sign-up pages (`/sign-in`, `/sign-up`).
- **[ ] Task:** Replace the `<UserButton>` in the main layout with a custom component that displays user info from Supabase and includes a sign-out mechanism.
- **[ ] Task:** Update all server-side API routes (`/api/lists`, `/api/user/*`, etc.) to use the Supabase server client for user authentication instead of Clerk's `auth()`.
- **[ ] Task:** Refactor all client-side components that use Clerk hooks (`useUser`) to fetch user data from the Supabase client.
- **[ ] Task:** Update the user profile page (`/dashboard/profile`) to manage user data via Supabase.
- **Success Criteria:** The application is fully functional using Supabase Auth. All previous features (creating lists, editing profile, etc.) work as expected.

#### Phase 3: Database Schema Migration & Cleanup
*Goal: Finalize the database changes and remove all remnants of Clerk.*
- **[ ] Task:** Write a SQL migration script to modify the `profiles` table. Remove the `clerk_id` column and add a `user_id` column with a foreign key constraint referencing `auth.users(id)`.
- **[ ] Task:** Since mapping Clerk IDs to Supabase IDs is non-trivial, the simplest path is to require existing users to re-register. Document this decision.
- **[ ] Task:** Uninstall Clerk packages (`@clerk/nextjs`).
- **[ ] Task:** Remove all Clerk-related environment variables from `.env` files and deployment configurations.
- **[ ] Task:** Delete old Clerk-related files (e.g., `/app/sign-in/[[...sign-in]]`, middleware, components).
- **Success Criteria:** The codebase is completely free of Clerk dependencies. The database schema is clean and correctly linked to Supabase Auth.

## [Planner Mode Active - Explore Page Analysis]

## Background and Motivation

The Explore page will allow users (including non-logged-in visitors) to discover all public lists on Snack. This is a key feature for growth, engagement, and social sharing. It should be visually appealing, performant, and support filtering, sorting, and searching of public lists.

## Key Challenges and Analysis
- **Scalability:** The backend must support pagination, sorting, and filtering efficiently (potentially large number of lists).
- **Search:** Should support searching by list title, description, and optionally username.
- **Filtering:** Should allow filtering by recency, popularity, and possibly tags (if available in schema).
- **UI/UX:** Needs a modern, responsive grid/list layout with clear list previews, avatars, and easy navigation to list/user pages.
- **Security:** Only public lists should be shown; private lists must be excluded.
- **Performance:** Fast load times, lazy loading/pagination, and minimal overfetching.

## High-level Task Breakdown

1. **Review Database Schema**
   - Confirm `lists` table fields: `is_public`, `created_at`, `title`, `description`, `public_id`, `user_id`, and any popularity metrics (views, saves, etc.).
   - Success: We have a clear schema reference for API design.

2. **Design & Implement Explore API Endpoint**
   - Create `/api/explore` (or similar) endpoint.
   - Supports: pagination (limit, offset/page), sorting (by date, popularity), filtering (public only), and search (title/description/username).
   - Success: API returns correct, paginated, filtered, and sorted public lists.

3. **Frontend Explore Page Skeleton**
   - Create `/explore` route/page in Next.js.
   - Add loading state, error state, and basic layout.
   - Success: Page loads with placeholder content and fetches from API.

4. **List Card UI Component**
   - Design a reusable card for list previews (title, emoji, description, user avatar, stats, etc.).
   - Success: Card looks good and is used in the Explore grid/list.

5. **Integrate API with Explore Page**
   - Fetch paginated public lists from API, render as cards.
   - Add infinite scroll or pagination controls.
   - Success: Lists load and update as user scrolls/pages.

6. **Add Sorting, Filtering, and Search UI**
   - Add controls for sort (e.g., Newest, Popular), search input, and any filters.
   - Success: User can search, sort, and filter lists; UI updates accordingly.

7. **Polish, Test, and Optimize**
   - Responsive design, accessibility, loading skeletons, error handling.
   - Test with large data sets.
   - Success: Page is fast, robust, and visually polished on all devices.

## Project Status Board

- [ ] 1. Review Database Schema
- [ ] 2. Design & Implement Explore API Endpoint
- [ ] 3. Frontend Explore Page Skeleton
- [ ] 4. List Card UI Component
- [ ] 5. Integrate API with Explore Page
- [ ] 6. Add Sorting, Filtering, and Search UI
- [ ] 7. Polish, Test, and Optimize

## Executor's Feedback or Assistance Requests
- None yet.

## Lessons
- (To be filled as we encounter issues or learnings during implementation)