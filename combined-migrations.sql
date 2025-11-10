-- ===================================
-- Migration: Analytics Tracking
-- File: supabase/migrations/012_add_analytics_tracking.sql
-- ===================================

-- Add analytics tracking tables for views and link clicks
-- =================================================================

-- List views tracking table
CREATE TABLE IF NOT EXISTS list_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip INET,
  viewer_user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link clicks tracking table
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  clicker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  clicker_ip INET,
  clicker_user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_list_views_list_id ON list_views(list_id);
CREATE INDEX idx_list_views_viewed_at ON list_views(viewed_at DESC);
CREATE INDEX idx_list_views_list_date ON list_views(list_id, viewed_at DESC);

CREATE INDEX idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX idx_link_clicks_list_id ON link_clicks(list_id);
CREATE INDEX idx_link_clicks_clicked_at ON link_clicks(clicked_at DESC);
CREATE INDEX idx_link_clicks_list_date ON link_clicks(list_id, clicked_at DESC);

-- Enable RLS on analytics tables
ALTER TABLE list_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_views
-- Anyone can insert view events (for public lists)
CREATE POLICY "Anyone can track views" ON list_views
  FOR INSERT WITH CHECK (true);

-- Users can view analytics for their own lists
CREATE POLICY "Users can view analytics for their lists" ON list_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = list_views.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- RLS Policies for link_clicks
-- Anyone can insert click events (for public lists)
CREATE POLICY "Anyone can track clicks" ON link_clicks
  FOR INSERT WITH CHECK (true);

-- Users can view click analytics for their own lists
CREATE POLICY "Users can view click analytics for their lists" ON link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = link_clicks.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Create materialized view for aggregated analytics (optional, for better performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS list_analytics_summary AS
SELECT 
  l.id as list_id,
  l.user_id,
  l.title,
  l.is_public,
  COUNT(DISTINCT lv.id) as total_views,
  COUNT(DISTINCT lv.viewer_id) as unique_viewers,
  COUNT(DISTINCT lv.viewer_ip) as unique_ips,
  COUNT(DISTINCT lc.id) as total_clicks,
  l.save_count,
  MAX(lv.viewed_at) as last_viewed_at,
  MAX(lc.clicked_at) as last_clicked_at
FROM lists l
LEFT JOIN list_views lv ON l.id = lv.list_id
LEFT JOIN link_clicks lc ON l.id = lc.list_id
GROUP BY l.id, l.user_id, l.title, l.is_public, l.save_count;

-- Create index on materialized view
CREATE INDEX idx_list_analytics_user_id ON list_analytics_summary(user_id);
CREATE INDEX idx_list_analytics_total_views ON list_analytics_summary(total_views DESC);

-- Function to refresh analytics summary (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY list_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- Migration: Short Public IDs
-- File: supabase/migrations/013_replace_public_ids_with_short_ids.sql
-- ===================================

-- Replace UUID public_id with shorter nanoid-style IDs
-- =================================================================

-- Drop existing public_id column and recreate with text type
ALTER TABLE lists DROP COLUMN public_id;
ALTER TABLE lists ADD COLUMN public_id TEXT UNIQUE;

-- Create function to generate short random IDs (similar to nanoid)
CREATE OR REPLACE FUNCTION generate_short_id(length integer DEFAULT 8)
RETURNS text AS $$
DECLARE
    alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing lists with short IDs
UPDATE lists SET public_id = generate_short_id(8) WHERE public_id IS NULL;

-- Create function to automatically generate short ID for new lists
CREATE OR REPLACE FUNCTION set_short_public_id()
RETURNS trigger AS $$
BEGIN
    IF NEW.public_id IS NULL THEN
        -- Try to generate a unique short ID (retry if collision)
        FOR i IN 1..10 LOOP
            NEW.public_id := generate_short_id(8);
            
            -- Check if this ID already exists
            IF NOT EXISTS (SELECT 1 FROM lists WHERE public_id = NEW.public_id AND id != NEW.id) THEN
                EXIT; -- Found unique ID, exit loop
            END IF;
            
            -- If we're on the last attempt and still no unique ID, make it longer
            IF i = 10 THEN
                NEW.public_id := generate_short_id(12);
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate short IDs
DROP TRIGGER IF EXISTS trigger_set_short_public_id ON lists;
CREATE TRIGGER trigger_set_short_public_id
    BEFORE INSERT OR UPDATE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION set_short_public_id();

-- Add NOT NULL constraint after updating existing records
ALTER TABLE lists ALTER COLUMN public_id SET NOT NULL;

-- Add saved lists functionality
-- Users can save/bookmark lists they like
-- =================================================================

-- Create saved_lists junction table
CREATE TABLE IF NOT EXISTS saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_saved_lists_user_id ON saved_lists(user_id);
CREATE INDEX idx_saved_lists_list_id ON saved_lists(list_id);
CREATE INDEX idx_saved_lists_saved_at ON saved_lists(saved_at DESC);

-- Enable RLS on saved_lists table
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_lists
-- Users can insert their own saves
CREATE POLICY "Users can save lists" ON saved_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own saved lists
CREATE POLICY "Users can view their saved lists" ON saved_lists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can unsave lists" ON saved_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update list save_count when a save is added/removed
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists SET save_count = save_count + 1 WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update save_count
DROP TRIGGER IF EXISTS trigger_update_save_count ON saved_lists;
CREATE TRIGGER trigger_update_save_count
  AFTER INSERT OR DELETE ON saved_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_list_save_count();
