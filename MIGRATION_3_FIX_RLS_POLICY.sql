-- Migration: Fix RLS Policy for Unauthenticated Users
-- Issue: The RLS policy was calling user_has_purchased_list() with NULL user IDs
-- for unauthenticated users, causing queries to fail
--
-- This migration adds a NULL check before calling the function

-- ============================================================================
-- Fix RLS policy on lists table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own lists or purchased lists" ON lists;

CREATE POLICY "Users can view their own lists or purchased lists" ON lists
  FOR SELECT USING (
    auth.uid() = user_id -- Owner can always view
    OR (is_public = true AND (price_cents IS NULL OR price_cents = 0)) -- Free public lists
    OR (is_public = true AND auth.uid() IS NOT NULL AND user_has_purchased_list(auth.uid(), id)) -- Purchased paywalled lists (only check if user is authenticated)
  );

COMMENT ON POLICY "Users can view their own lists or purchased lists" ON lists IS
'Allow users to view:
1. Their own lists (authenticated)
2. Free public lists (anyone)
3. Paid public lists they have purchased (authenticated only)';

-- ============================================================================
-- Fix RLS policy on links table (same issue)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view links if they have access" ON links;

CREATE POLICY "Users can view links if they have access" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = links.list_id
      AND (
        lists.user_id = auth.uid() -- Owner
        OR (lists.is_public = true AND (lists.price_cents IS NULL OR lists.price_cents = 0)) -- Free
        OR (lists.is_public = true AND auth.uid() IS NOT NULL AND user_has_purchased_list(auth.uid(), lists.id)) -- Purchased (only check if user is authenticated)
      )
    )
  );

COMMENT ON POLICY "Users can view links if they have access" ON links IS
'Allow users to view links in lists they have access to (owned, free, or purchased)';
