# Tech Stack

A comprehensive list of all technologies, platforms, and external services used in Snack.

## Core Framework & Infrastructure

### Frontend
- **Next.js 15** - React framework with App Router, SSR, and API routes
- **React 19** - UI library for building components
- **TypeScript 5.6** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 12** - Animation library for smooth UI transitions

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions (Paid/Free tier available)
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side
  - `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server-side operations

### Deployment & Hosting
- **Vercel** - Hosting and automatic deployments from GitHub (Paid/Free tier available)
- **GitHub** - Version control and CI/CD integration

## External APIs & Services

### Data Fetching
- **OpenGraph.io** - API for scraping OG images, metadata, and favicons from URLs (Paid - requires API key)
  - `OPENGRAPH_IO_API_KEY` - API key for OpenGraph.io service
  - Handles bot-protected sites and returns structured metadata
  - Alternative proxy: r.jina.ai (used as fallback)

### AI/ML Services
- **OpenAI API** - AI capabilities (if used for features like content generation)
  - `OPENAI_API_KEY` - OpenAI API key

### Design & Development Tools
- **Figma API** - Design integration for Figma MCP server
  - `FIGMA_API_KEY` - API key for Figma integration
  - Used via MCP (Model Context Protocol) server

### MCP Servers (Model Context Protocol)
- **@21st-dev/magic** - Advanced development tool with AI capabilities
  - `MAGIC_API_KEY` - API key for 21st.dev magic MCP server
  - Command: `npx -y @21st-dev/magic@latest`
- **figma-remote-mcp** - Design integration for Figma API access
  - URL: `https://mcp.figma.com/mcp`
- **context7** - Upstash-powered context management
  - URL: `https://mcp.context7.com/mcp`
- **og-mcp** - OpenGraph.io MCP integration
  - Command: `opengraph-io-mcp`

## UI Components & Libraries

### Component Libraries
- **Radix UI** - Headless UI primitives
  - `@radix-ui/react-slot` - Composition utilities
- **Lucide React** - Icon library (540+ icons)
- **Emoji Mart** - Emoji picker component
  - `@emoji-mart/react` - React wrapper
  - `@emoji-mart/data` - Emoji data

### Form Handling
- **React Hook Form** - Form state management and validation
- **Zod 4** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### Styling & Animation
- **class-variance-authority** - Type-safe component variants
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes without conflicts
- **tailwindcss-animate** - Animation utilities for Tailwind
- **next-themes** - Theme management (dark/light mode)

## Development Tools

### Type Checking & Linting
- **ESLint 9** - Code linting
- **@typescript-eslint** - TypeScript ESLint rules
- **eslint-config-next** - Next.js ESLint configuration

### Build Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - Automatic CSS vendor prefixing

### Utilities
- **nanoid** - Unique ID generation
- **dotenv** - Environment variable management

## Cost Breakdown

### Free Tier Services
- Supabase (Free tier: 500MB database, 2GB bandwidth)
- Vercel (Free tier: Unlimited personal projects)
- GitHub (Free for public repositories)

### Paid/API Key Required
- **OpenGraph.io** - Requires API key, paid service for OG data scraping
- **OpenAI API** - Pay-per-use API for AI features
- **Figma API** - Requires API key for design integration
- **@21st-dev/magic** - Requires API key for MCP server

### Optional/Fallback Services
- **r.jina.ai** - Free proxy fallback for OG data fetching (no API key required)

## Environment Variables Summary

Required for production:
```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase public key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase admin key
OPENGRAPH_IO_API_KEY=              # OpenGraph.io API key
```

Optional (for extended features):
```
OPENAI_API_KEY=                    # OpenAI API
FIGMA_API_KEY=                     # Figma integration
MAGIC_API_KEY=                     # 21st.dev magic MCP
```

## Architecture Notes

- **Server-Side Rendering**: Next.js App Router with SSR for SEO
- **Client-Side State**: React Context + hooks for auth and data
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase real-time subscriptions for live updates
- **Caching**: Next.js built-in caching with revalidation
- **Analytics**: Custom analytics tracking views and clicks
