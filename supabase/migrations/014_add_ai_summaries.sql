-- ===================================
-- Migration: AI-Powered List Summaries
-- File: supabase/migrations/014_add_ai_summaries.sql
-- ===================================

-- Add AI summary columns to lists table for LLM-readable links
-- =================================================================

-- Add AI summary fields
ALTER TABLE lists
  ADD COLUMN ai_summary TEXT,
  ADD COLUMN ai_themes TEXT[],
  ADD COLUMN ai_generated_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN lists.ai_summary IS 'AI-generated summary of all links in the list for LLM consumption';
COMMENT ON COLUMN lists.ai_themes IS 'Array of key themes/topics identified by AI';
COMMENT ON COLUMN lists.ai_generated_at IS 'Timestamp when AI summary was last generated';

-- Create index for querying lists that need summary generation
-- This helps identify public lists without summaries for background processing
CREATE INDEX idx_lists_ai_summary_status ON lists(ai_generated_at, is_public)
  WHERE ai_summary IS NULL AND is_public = true;

-- Create index for efficiently fetching lists with summaries
CREATE INDEX idx_lists_with_ai_summary ON lists(ai_generated_at DESC)
  WHERE ai_summary IS NOT NULL;
