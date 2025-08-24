-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    emoji TEXT DEFAULT '🎯',
    emoji_3d JSONB,
    is_public BOOLEAN DEFAULT false,
    price_cents INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create links table
CREATE TABLE IF NOT EXISTS links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    favicon_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_is_public ON lists(is_public);
CREATE INDEX IF NOT EXISTS idx_links_list_id ON links(list_id);
CREATE INDEX IF NOT EXISTS idx_links_position ON links(list_id, position);

-- Enable Row Level Security
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Create policies for lists
CREATE POLICY "Users can view their own lists" ON lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lists" ON lists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own lists" ON lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for links
CREATE POLICY "Users can view links in their lists" ON links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lists 
            WHERE lists.id = links.list_id 
            AND lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view links in public lists" ON links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lists 
            WHERE lists.id = links.list_id 
            AND lists.is_public = true
        )
    );

CREATE POLICY "Users can create links in their lists" ON links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lists 
            WHERE lists.id = links.list_id 
            AND lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update links in their lists" ON links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lists 
            WHERE lists.id = links.list_id 
            AND lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete links from their lists" ON links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lists 
            WHERE lists.id = links.list_id 
            AND lists.user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to increment link positions
CREATE OR REPLACE FUNCTION increment_link_positions(target_list_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE links 
  SET position = position + 1 
  WHERE list_id = target_list_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();