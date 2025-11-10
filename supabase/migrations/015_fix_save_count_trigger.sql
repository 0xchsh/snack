-- Fix save_count trigger to bypass RLS
-- The trigger function needs SECURITY DEFINER to update lists table
-- =================================================================

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_list_save_count()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
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

-- Trigger already exists, this is just a function update
-- The existing trigger will automatically use the updated function
