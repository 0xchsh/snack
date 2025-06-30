# API Route Migration Pattern: Clerk to Supabase Auth

## 🔄 Migration Pattern

### Before (Clerk):
```typescript
import { currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up internal user ID
  const { data: userRow, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single();

  if (userLookupError || !userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Use userRow.id for database operations
  const { data, error } = await supabase
    .from('some_table')
    .select('*')
    .eq('user_id', userRow.id);
}
```

### After (Supabase):
```typescript
import { createServerSupabaseClient } from '@/lib/supabase';
import { createServerAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // user.id is now the primary key - no lookup needed
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('some_table')
    .select('*')
    .eq('user_id', user.id);
}
```

## 📋 Step-by-Step Migration Checklist

### For Each API Route:

1. **Update Imports**:
   ```typescript
   // Remove
   import { currentUser } from '@clerk/nextjs/server';
   import { supabase } from '@/lib/supabase';
   
   // Add
   import { createServerSupabaseClient } from '@/lib/supabase';
   import { createServerAuth } from '@/lib/auth';
   ```

2. **Replace Authentication**:
   ```typescript
   // Old
   const user = await currentUser();
   
   // New
   const serverAuth = createServerAuth();
   const user = await serverAuth.getUser();
   ```

3. **Remove User Lookup Logic**:
   ```typescript
   // Remove this entire block
   const { data: userRow, error: userLookupError } = await supabase
     .from('users')
     .select('id')
     .eq('clerk_id', user.id)
     .single();
   ```

4. **Update Database Client**:
   ```typescript
   // Add this for each database operation
   const supabase = createServerSupabaseClient();
   ```

5. **Update User ID References**:
   ```typescript
   // Old
   .eq('user_id', userRow.id)
   
   // New
   .eq('user_id', user.id)
   ```

## 🗂️ Files to Update

### High Priority (Core API Routes):
- ✅ `/api/lists/route.ts` - Already updated
- 🔄 `/api/lists/[publicId]/route.ts`
- 🔄 `/api/lists/[publicId]/items/route.ts`
- 🔄 `/api/saved-lists/route.ts`
- 🔄 `/api/user/update-profile/route.ts`

### Medium Priority:
- 🔄 `/api/user/check-username/route.ts`
- 🔄 `/api/user/update-email/route.ts`
- 🔄 `/api/user/delete-account/route.ts`
- 🔄 `/api/lists/dashboard/[publicId]/route.ts`

### Low Priority (Test/Debug Routes):
- 🔄 `/api/test-db/route.ts`
- 🔄 `/api/debug-clerk/route.ts` (can be removed)

## 🧩 Common Patterns

### Pattern 1: User Profile Operations
```typescript
// Before
const { data: userRow } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_id', user.id)
  .single();

// After
const { data: userRow } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Pattern 2: User Ownership Checks
```typescript
// Before
const { data: list } = await supabase
  .from('lists')
  .select('user_id')
  .eq('id', listId)
  .single();

const { data: userRow } = await supabase
  .from('users')
  .select('id')
  .eq('clerk_id', user.id)
  .single();

if (list.user_id !== userRow.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// After
const { data: list } = await supabase
  .from('lists')
  .select('user_id')
  .eq('id', listId)
  .single();

if (list.user_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Pattern 3: Creating Records
```typescript
// Before
const { data: userRow } = await supabase
  .from('users')
  .select('id')
  .eq('clerk_id', user.id)
  .single();

const { data } = await supabase
  .from('lists')
  .insert({
    title,
    user_id: userRow.id,
    // ...
  });

// After
const { data } = await supabase
  .from('lists')
  .insert({
    title,
    user_id: user.id,
    // ...
  });
```

## ⚠️ Important Notes

1. **Database Schema**: After migration, update users table to use auth.uid() as primary key
2. **Error Handling**: Maintain same error response format for API compatibility
3. **Testing**: Test each route after migration to ensure functionality
4. **RLS Policies**: Ensure Row Level Security policies are correctly set up

## 🧪 Testing Commands

Test each route after migration:

```bash
# Test authentication works
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/lists

# Test unauthorized access
curl http://localhost:3001/api/lists

# Test CRUD operations
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test List"}' \
  http://localhost:3001/api/lists
```

## 🔄 Rollback Plan

If issues arise:
1. Keep original files backed up
2. Can temporarily restore Clerk auth
3. Database remains unchanged during API migration
4. Full rollback requires reverting all updated files

This pattern ensures consistent, secure, and maintainable API routes with Supabase auth.