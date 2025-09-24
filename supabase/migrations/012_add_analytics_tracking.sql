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