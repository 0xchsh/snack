# 🍿 Snack - Link Curation App

Snack is a modern web application for curating and sharing collections of links. Create beautiful lists of your favorite websites, articles, tools, and resources, then share them with others.

## ✨ Features

- **📝 Create Lists**: Organize your favorite links into themed collections
- **🔗 Smart Link Previews**: Automatically fetch titles, descriptions, and favicons
- **🎨 Beautiful UI**: Clean, modern interface built with Tailwind CSS
- **📱 Responsive Design**: Works great on desktop and mobile
- **🚀 Share Lists**: Public URLs for sharing your curated lists
- **👤 User Profiles**: Personal profiles with all your public lists
- **🔍 Explore**: Discover interesting lists from other users
- **🔐 Secure Authentication**: Powered by Supabase Auth

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Drag & Drop**: DND Kit
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- (Optional) Google OAuth app for social login

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd snack-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Database Setup

1. Run the database migration scripts in your Supabase SQL editor:
   - See `SUPABASE_AUTH_SETUP.md` for detailed setup instructions
   - Run the SQL scripts to create tables and policies

2. Configure authentication providers in Supabase dashboard

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run migrate:users` - Migrate users from Clerk to Supabase
- `npm run migrate:status` - Check user migration status

## 🔐 Authentication

This app uses Supabase Auth with support for:

- **Email/Password**: Standard email-based authentication
- **Google OAuth**: One-click Google sign-in
- **Password Reset**: Secure password recovery
- **Email Verification**: Optional email confirmation

### User Migration

If you're migrating from Clerk, use the built-in migration tools:

```bash
# Check current migration status
npm run migrate:status

# Run user migration (test in staging first!)
npm run migrate:users
```

See `USER_MIGRATION_GUIDE.md` for detailed migration instructions.

## 🗄️ Database Schema

Key tables:
- `users` - User profiles and metadata
- `lists` - User-created link collections
- `list_items` - Individual links within lists
- `saved_lists` - User's saved/bookmarked lists

See `SUPABASE_AUTH_SETUP.md` for complete schema details.

## 🛡️ Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Server-side Auth**: Secure API routes with middleware
- **CSRF Protection**: Built-in Next.js protections
- **Input Validation**: Zod schemas for data validation
- **Rate Limiting**: API endpoint protection

## 📱 Core Features

### List Management
- Create and edit link collections
- Add links with automatic metadata fetching
- Drag-and-drop reordering
- Public/private list visibility
- Custom list descriptions and emojis

### User Profiles
- Public profile pages showing user's lists
- Customizable usernames
- Profile picture support
- List statistics and activity

### Discovery
- Explore page showing public lists
- Search and filter functionality
- User profiles and list browsing

## 🎨 UI/UX Features

- **Dark/Light Mode**: System preference detection
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Action feedback
- **Keyboard Navigation**: Accessibility support

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Tests include:
- Component unit tests
- API route integration tests
- Authentication flow tests
- Database interaction tests

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production

Ensure these are set in your deployment environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID` (if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` (if using Google OAuth)

## 📖 Documentation

- `SUPABASE_AUTH_SETUP.md` - Supabase configuration guide
- `USER_MIGRATION_GUIDE.md` - Clerk to Supabase migration
- `USER_MIGRATION_STRATEGY.md` - Migration planning
- `API_MIGRATION_PATTERN.md` - API refactoring guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the documentation files in the repository
2. Review Supabase dashboard for Auth/Database logs
3. Check the browser console for client-side errors
4. Review server logs for API issues

## 🎯 Roadmap

- [ ] Advanced search and filtering
- [ ] List categories and tags
- [ ] Collaborative lists
- [ ] List templates
- [ ] Import/export functionality
- [ ] API for third-party integrations
- [ ] Mobile app
- [ ] Analytics dashboard