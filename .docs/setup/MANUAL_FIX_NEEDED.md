# Manual Database Fix Required

## Issue
The short ID generation function in the database is using a different alphabet than our client-side code, causing inconsistencies.

## Fix Required
Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Fix short ID generation to use URL-safe alphabet matching client-side
CREATE OR REPLACE FUNCTION generate_short_id(length integer DEFAULT 8)
RETURNS text AS $$
DECLARE
    -- URL-safe alphabet (no confusing chars like 0/O, 1/I/l)
    alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    result text := '';
    i integer;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update all existing lists with properly formatted short IDs
UPDATE lists SET public_id = generate_short_id(8) WHERE public_id IS NOT NULL;
```

## After running this SQL:
1. New lists will generate proper short IDs like `K3mN7x2P`
2. Existing lists will be updated with new short IDs
3. The alphabet will match the client-side nanoid generation

## Then run:
```bash
node scripts/apply-migrations.js
```

To verify everything is working correctly.