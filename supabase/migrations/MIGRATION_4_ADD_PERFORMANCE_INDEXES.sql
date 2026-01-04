-- =============================================
-- Migration 4: Add Performance Indexes
-- =============================================
-- This migration adds database indexes to significantly improve query performance
-- for the most common queries in the application.

-- Lists table indexes
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_public_id ON lists(public_id);
CREATE INDEX IF NOT EXISTS idx_lists_is_public ON lists(is_public);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);

-- Links table indexes
CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

-- Saved lists table indexes
CREATE INDEX IF NOT EXISTS idx_saved_lists_user_id ON saved_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_lists_list_id ON saved_lists(list_id);
CREATE INDEX IF NOT EXISTS idx_saved_lists_user_list ON saved_lists(user_id, list_id);
CREATE INDEX IF NOT EXISTS idx_saved_lists_saved_at ON saved_lists(saved_at DESC);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_list_views_list_id ON list_views(list_id);
CREATE INDEX IF NOT EXISTS idx_list_views_created_at ON list_views(list_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_link_clicks_list_id ON link_clicks(list_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON link_clicks(created_at DESC);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- List purchases table indexes (for monetization)
CREATE INDEX IF NOT EXISTS idx_list_purchases_list_id ON list_purchases(list_id);
CREATE INDEX IF NOT EXISTS idx_list_purchases_buyer_id ON list_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_list_purchases_created_at ON list_purchases(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lists_user_public ON lists(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_lists_public_created ON lists(is_public, created_at DESC) WHERE is_public = true;

-- Comment explaining the indexes
COMMENT ON INDEX idx_lists_user_id IS 'Speed up queries for user-specific lists';
COMMENT ON INDEX idx_lists_public_id IS 'Speed up public URL lookups';
COMMENT ON INDEX idx_links_list_id IS 'Speed up fetching links for a list';
COMMENT ON INDEX idx_saved_lists_user_id IS 'Speed up fetching saved lists for a user';
COMMENT ON INDEX idx_list_views_list_id IS 'Speed up analytics queries';
