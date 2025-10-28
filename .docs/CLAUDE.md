# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**[PROJECT_NAME]** - [Brief description of your project and its purpose]. This Next.js application [describe main functionality and user value proposition].

## Tech Stack
- **Frontend Framework**: Next.js (latest stable) with Turbopack (development)
- **Backend and Database**: Supabase (PostgreSQL database with real-time subscriptions)
- **Authentication**: Supabase Auth with email/password and OAuth providers
- **Version Control**: GitHub
- **Deployment**: Vercel (with automatic deployments from GitHub)
- **Language**: TypeScript (latest stable)
- **UI Framework**: Tailwind CSS with Radix UI components
- **State Management**: Server-side rendering with Next.js App Router + React Context
- **Testing**: Jest with React Testing Library
- **Package Manager**: npm (latest stable)

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run prepare` - Set up Husky pre-commit hooks (if configured)

## Architecture Overview

### Key Architecture Patterns

**Database Integration**: The app maintains user records in Supabase's `users` table keyed by Supabase Auth user ID. User creation happens automatically via database triggers or application logic during authentication.

**Authentication Flow**: Supabase Auth middleware protects routes. Protected pages require authentication and redirect to `/auth/sign-in` if not authenticated.

**Auth Implementation**: 
- Custom auth utilities in `/src/lib/auth.ts` and `/src/lib/auth-server.ts`
- Auth context provider in `/src/hooks/useAuth.tsx` or similar
- Authentication pages at `/auth/sign-in` and `/auth/sign-up`
- OAuth callback handler at `/auth/callback`

**API Structure**: 
- `/api/*` - Server-side API routes following RESTful conventions
- Uses Next.js App Router API routes or Pages Router API routes
- Integrates with Supabase client for database operations

**Component Architecture**: Uses composition pattern with reusable UI components. Modern React patterns with hooks and context for state management.

### Directory Structure

- `/src/app` - Next.js App Router pages and API routes (App Router)
- `/src/pages` - Next.js Pages Router (if using Pages Router)
- `/src/components` - Reusable React components
- `/src/components/ui` - Base UI components (Radix UI, custom components)
- `/src/lib` - Utility functions and external service clients
- `/src/hooks` - Custom React hooks and context providers
- `/src/types` - TypeScript type definitions
- `/src/styles` - Global styles and Tailwind configuration
- `/src/__tests__/` - Test files

### Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

Optional environment variables:
- OAuth provider credentials (Google, GitHub, etc.)
- Third-party service API keys
- Feature flags and configuration
- MCP server API keys:
  - `MAGIC_API_KEY` - API key for @21st-dev/magic MCP server
  - `FIGMA_API_KEY` - API key for Figma MCP server integration

**Note**: OAuth providers must be configured in your Supabase dashboard under Authentication > Providers.

### MCP Server Integration

The project includes Model Context Protocol (MCP) server configurations for enhanced AI tooling:

**Available MCP Servers:**
- **@21st-dev/magic** - Advanced development tool with AI capabilities
- **Figma MCP** - Design integration for Figma API access  
- **context7** - Upstash-powered context management

**Configuration:**
- MCP servers are defined in `mcp.json` with environment variable substitution
- API keys are stored securely in `.env.local` (never commit these to version control)
- The context7 server requires no additional configuration

**Usage:**
- Use MCP servers for advanced development workflows
- Leverage Figma integration for design-to-code workflows  
- Utilize magic for enhanced AI-powered development tasks

### Build Configuration

Next.js configuration optimized for:
- Modern JavaScript/TypeScript features
- Image optimization for various domains
- Environment-specific builds
- TypeScript and ESLint integration (configurable strictness)

### Testing Setup

Testing framework configured with:
- Jest with jsdom environment for React components
- React Testing Library for component testing
- Module path mapping for absolute imports
- Mocking setup for external services (Supabase, etc.)

## Code Style & Conventions
- Use ES modules (import/export)
- Prefer function components with React Hooks
- Use TypeScript strict mode (configurable in tsconfig.json)
- Destructure imports when possible: `import { foo } from 'bar'`
- Use absolute imports: `@/components/Button` instead of relative paths
- Components should be PascalCase, files should match component names
- Use descriptive variable names, avoid abbreviations
- Follow modern React patterns (hooks, context, composition)
- Use appropriate UI component patterns (Radix UI primitives when applicable)

## Security Guidelines
- Never commit secrets, API keys, or sensitive data to repository
- Use environment variables for all configuration
- Validate all user inputs on both client and server
- Implement proper authentication and authorization
- Use database security features (RLS, policies, etc.)
- Sanitize data before database operations
- Use HTTPS in production
- Follow platform-specific security best practices

## Git Workflow
- **Branch naming**: `feature/description` or `fix/description` (adapt to team conventions)
- **Commit format**: Conventional commits (feat:, fix:, docs:, etc.) or team standard
- Never commit directly to `main`/`master` branch
- Create pull requests for all changes
- Use automated checks (linting, testing, type checking)

## Do Not Section
- Do not edit auto-generated files (typically in `/generated/` or similar)
- Do not use `any` type in TypeScript without justification
- Do not bypass TypeScript checks without good reason
- Do not modify database schemas without proper migrations
- Do not hardcode environment-specific values in source code
- Do not bypass authentication/authorization for protected resources
- Do not use development-only tools in production builds

## Task Workflow

### Development Process
1. **Planning Phase**: First think through the problem, read the codebase for relevant files, and write a plan to `scratchpad.md`.
2. **Todo Structure**: The plan should have a list of todo items that you can check off as you complete them.
3. **Plan Verification**: Before you begin working, check in with me and I will verify the plan.
4. **Implementation**: Then, begin working on the todo items, marking them as complete as you go.
5. **Progress Updates**: Please every step of the way just give me a high level explanation of what changes you made.
6. **Simplicity Principle**: Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. **Documentation**: Finally, add a review section to the `scratchpad.md` file with a summary of the changes you made and any other relevant information.

### Workflow Guidelines
- **Read First**: Always examine existing code patterns before making changes
- **Plan in Writing**: Use `scratchpad.md` as your planning document
- **Small Iterations**: Break large tasks into small, manageable pieces
- **Minimal Impact**: Each change should touch the fewest files possible
- **Clear Communication**: Provide high-level summaries of each change
- **Documentation**: Keep `scratchpad.md` updated with progress and learnings

## Claude Prompting Rules

### Token Optimization
- **Maximize attention with keyword anchors**
  - When prompt length is high or context may be truncated:
    - Prepend with **"think hard"** or **"ultrathink"**.
    - Append with **"think step by step..."** to improve token retention.

- **Prioritize tokens by placement**
  - Place all context (app background, user roles, product goals, limitations) at the **beginning** of the prompt.
  - Place all task instructions at the **end** of the prompt.

### Task Execution
- **Avoid generic role interpretation**
  - When given a role (e.g., "senior engineer"):
    - Override with explicit instructions.
      - Define responsibilities.
      - Specify tasks.
      - Outline expected outputs.
    - Ignore vague role titles unless detailed behavior is defined.

- **Pre-task decomposition**
  - Before starting any task longer than 100 tokens or involving implementation:
    - Pause and output a breakdown of atomic subtasks as a checklist.
    - Use this checklist to guide further completions.

### Error Handling & Quality
- **Handle errors with root cause tracing**
  - If output or user feedback indicates failure:
    - Trace the full flow from input → logic → output.
    - Diagnose and respond based on the **root cause**, not just the symptom.

- **Self-review on completion**
  - After completing a task:
    - Run an internal review cycle.
      - Criticize weaknesses.
      - Identify structural gaps.
      - Avoid non-production patterns.
    - Generate an implementation plan to improve the result.
    - Optionally, execute improvements automatically.

### Context & Examples
- **Prefer example-driven reasoning**
  - When code, design patterns, or APIs are involved:
    - Prioritize provided examples over abstract instructions.
    - If no examples are given, prompt the user for one before proceeding.

- **Ask clarifying questions when context is insufficient**
  - If a request is vague, ambiguous, or underspecified:
    - Pause and ask targeted clarifying questions before executing.

### Model & Platform Selection
- **Select model based on task type**
  - If model is `o3`:
    - Prioritize planning, task decomposition, debugging.
  - If model is `opus`:
    - Prioritize complex tasks, large refactors, reasoning.
  - If model is `sonnet`:
    - Prioritize precise, scoped tasks.
  - If model is `gemini`:
    - Prioritize visual wireframes, image + text tasks.

- **Select platform strategy**
  - If environment is:
    - `lovable`: Optimize for clean, reliable frontend generation.
    - `cursor`: Default behavior; enable all tool integrations and MCPs.
    - `replit`: Optimize for fast backend generation and Python tasks.
    - `claude code`: Emphasize deep code understanding and refactoring.

### Advanced Techniques
- **Use multi-model majority voting**
  - When multiple outputs are requested or needed:
    - Compare responses from different models.
    - Identify consensus patterns.
    - Prioritize overlap for final output.

- **Obey lightweight directives**
  - If prompt ends with "make this better", "clean this up", or similar:
    - Run a quality improvement pass using reasoning and self-critique.

- **Restart intelligently**
  - If prior attempts fail or loop:
    - Reinitialize the prompt using updated context.
    - Do not repeat broken logic paths.