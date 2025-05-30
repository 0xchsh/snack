# Background and Motivation
- The project is a Next.js app for curating and sharing lists of links ("Snack").
- Uses Clerk for authentication, Prisma (with SQLite) for data, and a modern UI stack (Radix, Tailwind, etc).
- User recently expressed concern about losing their lists and mentioned Supabase, but the current codebase uses Prisma/SQLite, not Supabase.

# Key Challenges and Analysis
- **Data Loss Concern:** No evidence of Supabase integration; all data is managed via Prisma/SQLite. If lists are missing, it may be due to local database resets, migrations, or environment misconfiguration.
- **Database:** The schema and migrations are present for SQLite. If the dev.db file is lost or reset, user data (lists/items) would be lost unless backed up.
- **User Management:** User accounts are tied to Clerk IDs. If Clerk user IDs change (e.g., new Clerk project or environment), lists may not be associated with the current user.
- **No Supabase:** If Supabase was used previously, its data is not referenced in the current codebase. Recovery would require access to the old Supabase project.

# High-level Task Breakdown
1. **Remove Prisma/SQLite and Add Supabase Client**
   - [ ] Uninstall Prisma and related packages.
   - [ ] Remove `prisma/` directory and `dev.db`.
   - [ ] Install and configure Supabase JS client.
2. **Refactor Data Access**
   - [ ] Update all API routes and server components to use Supabase.
   - [ ] Ensure all CRUD operations work with Supabase.
3. **Update Storage Logic**
   - [ ] Refactor file/image uploads to use Supabase Storage (if applicable).
4. **Test All Functionality**
   - [ ] Test all features in development.
   - [ ] Write/verify automated tests.
5. **Clean Up and Document**
   - [ ] Remove unused files and update documentation.

# Project Status Board
- [ ] 1. Remove Prisma/SQLite and Add Supabase Client
- [ ] 2. Refactor Data Access
- [ ] 3. Update Storage Logic
- [ ] 4. Test All Functionality
- [ ] 5. Clean Up and Document

# Executor's Feedback or Assistance Requests
- User has approved removing Prisma and refactoring to use only Supabase. Proceeding with step 1.
- Starting directory cleanup execution per the plan above.

# Lessons
- Always clarify which database is in use before making changes.
- Back up dev.db before running migrations or resetting data.
- If user mentions a different backend (e.g., Supabase), confirm integration before proceeding.
- Confirm with the user before removing major dependencies or making irreversible changes.

# Directory Cleanup Plan (Prisma Removal & Redundancies)
After scanning the `snack-app` directory, these items are safe to remove or need follow-up refactor work:

## Redundant / Generated Artifacts
- `.next/` – build artifacts; can be deleted and regenerated.
- `node_modules/` – will be regenerated after package reinstall (already pending manual cleanup).
- `tsconfig.tsbuildinfo` – TypeScript incremental file; can be deleted.
- `.DS_Store` – macOS metadata; safe to delete.
- `package-lock 2.json` – duplicate lockfile; keep only `package-lock.json`.
- `.env.*-backup` files – confirm with user; likely old backups -> remove or archive.

## Prisma-specific Assets to Remove
- `prisma/` directory (contains now-unused SQLite DB & migrations):
  - `prisma/dev.db`
  - `prisma/migrations/`
- `src/lib/prisma.ts` – singleton client.
- Any `import { prisma }` or `from '@/lib/prisma'` usages across codebase (needs refactor to Supabase).
- Prisma scripts in `package.json` (already removed).
- VSCode Prisma extension files (none found).

## Misc Duplicate / Obsolete Files
- `.vercel/` build cache (optional to keep, purgeable).
- `package-lock.json` will be regenerated after fresh install; OK to delete before reinstall.

## Safe Cleanup Sequence
1. **Create Git branch `cleanup/prisma-removal`** to preserve history.
2. **Backup** current `snack-app` directory (zip or git tag) just in case.
3. **Delete** redundant build/generated folders: `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`.
4. **Delete** Prisma assets: entire `prisma/` dir, `src/lib/prisma.ts`.
5. **Search & Refactor**: replace remaining `prisma` imports with Supabase logic (track separately).
6. **Remove** duplicate lockfile `package-lock 2.json` and extra `.env.*-backup` after confirmation.
7. **Run** `npm install` to regenerate `node_modules` & fresh `package-lock.json`.
8. **Commit** cleaned state and open PR for review.

## Additional Refactor Tasks (post-cleanup)
- Convert remaining API routes & server components that still reference Prisma.
- Update tests to use Supabase. 