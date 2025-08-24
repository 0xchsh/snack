-- STEP 2: Add indexes, RLS, triggers, and functions
-- Run this after STEP_1_TABLES_ONLY.sql succeeds

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Lists indexes
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_public_id ON lists(public_id);
CREATE INDEX IF NOT EXISTS idx_lists_is_public ON lists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_lists_save_count ON lists(save_count DESC) WHERE save_count > 0;
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at DESC);

-- Links indexes
CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

-- Saved lists indexes
CREATE INDEX IF NOT EXISTS idx_saved_lists_user_saved_at ON saved_lists(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_lists_list_saved_at ON saved_lists(list_id, saved_at DESC);

-- =================================================================
-- ROW LEVEL SECURITY (RLS)
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own user record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own user record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Lists policies
CREATE POLICY "Users can view their own lists" ON lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public lists" ON lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

-- Links policies
CREATE POLICY "Users can view links in their own lists" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view links in public lists" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.is_public = true
    )
  );

CREATE POLICY "Users can create links in their own lists" ON links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links in their own lists" ON links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links from their own lists" ON links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists 
      WHERE lists.id = links.list_id 
      AND lists.user_id = auth.uid()
    )
  );

-- Saved lists policies
CREATE POLICY "Users can view their own saved lists" ON saved_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save lists for themselves" ON saved_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved lists" ON saved_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved lists" ON saved_lists
  FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- FUNCTIONS & TRIGGERS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment link positions
CREATE OR REPLACE FUNCTION increment_link_positions(target_list_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE links 
  SET position = position + 1 
  WHERE list_id = target_list_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update save count when lists are saved/unsaved
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists 
    SET save_count = save_count + 1 
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists 
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, first_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- CREATE TRIGGERS
-- =================================================================

-- Updated at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Save count triggers
CREATE TRIGGER trigger_update_save_count
  AFTER INSERT OR DELETE ON saved_lists
  FOR EACH ROW EXECUTE FUNCTION update_list_save_count();

-- Auto-create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- USEFUL VIEWS
-- =================================================================

-- View for popular public lists
DROP VIEW IF EXISTS popular_lists;
CREATE VIEW popular_lists AS
SELECT 
  l.*,
  u.username
FROM lists l
JOIN users u ON l.user_id = u.id
WHERE l.is_public = true AND l.save_count > 0
ORDER BY l.save_count DESC, l.created_at DESC;

SELECT 'All features added successfully!' as result;