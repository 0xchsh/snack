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