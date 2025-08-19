# Snack - Curated Link Collections

A modern web platform that allows content creators to curate, organize, and share collections of links through visually appealing lists. Users can create personalized, shareable link collections with monetization options and analytics.

## ✨ Features

### Core Features
- **Link Curation**: Create lists with emoji and titles, add unlimited links (up to 100 per list)
- **Smart Metadata**: Automatic extraction of og:title, og:image, and favicon with fallback handling
- **Drag & Drop**: Smooth reordering of links with intuitive interactions
- **Discovery**: Explore popular lists ranked by total views with search functionality
- **Monetization**: Stripe integration for per-list pricing with paywall preview
- **Analytics**: Comprehensive analytics dashboard for creators (views, clicks, bookmarks, revenue)
- **User Profiles**: Public profiles with verification badges for connected social accounts

### User Experience
- Mobile-responsive design with modern UI components
- Real-time updates for list changes
- Loading states and error handling
- Open Runde typography for professional appearance

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth (email/password + OAuth providers)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Typography**: Open Runde font family
- **State Management**: React Context + Server-side rendering
- **Payment**: Stripe integration for monetization
- **Deployment**: Vercel with automatic GitHub deployments
- **Testing**: Jest with React Testing Library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for monetization features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xchsh/snack.git
   cd snack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles with Tailwind
│   └── api/               # API routes for backend functionality
├── components/            # Reusable React components
│   └── ui/                # Base UI components (shadcn/ui)
├── lib/                   # Utility functions and external service clients
│   ├── utils.ts           # shadcn/ui utilities (cn function)
│   ├── auth.ts            # Authentication utilities
│   └── supabase.ts        # Supabase client configuration
├── hooks/                 # Custom React hooks and context providers
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
```

## 🔧 Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Type checking
npm run type-check
```

## 🎨 Design System

### Typography
The project uses **Open Runde** as the primary font family - a modern, rounded sans-serif that provides a friendly yet professional appearance.

Font weights included:
- 400 (Regular) - Body text
- 500 (Medium) - Emphasis
- 600 (Semibold) - Headings and important UI elements
- 700 (Bold) - Primary headings and CTAs

### UI Components
Built with shadcn/ui components using a custom theme configuration for consistent styling and rapid development.

## 🗄 Database Schema

### Core Tables
- **users**: User profiles and metadata
- **lists**: Link collections with metadata
- **links**: Individual links within lists
- **analytics**: View and click tracking
- **payments**: Transaction records

## 🔐 Authentication & Security

- Supabase Auth with email/password and OAuth providers
- Row Level Security (RLS) policies for data protection
- Input validation with Zod schemas
- Secure API routes with proper authentication checks
- Content Security Policy headers

## 📊 Analytics & Monitoring

- List view counts and click tracking
- User engagement metrics
- Revenue tracking for monetized lists
- Creator-only analytics dashboard

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- All development variables
- OAuth provider credentials
- Production Stripe keys
- Custom domain configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Run tests and ensure they pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style Guidelines
- Use TypeScript strict mode
- Follow ESLint configuration
- Write meaningful variable names
- Add JSDoc comments for complex functions
- Maintain test coverage above 80%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for backend and authentication
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Open Runde](https://github.com/lauridskern/open-runde) for typography

---

Built with ❤️ for creators and curators worldwide.