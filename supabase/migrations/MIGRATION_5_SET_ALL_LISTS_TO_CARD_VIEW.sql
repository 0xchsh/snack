-- Migration: Set all lists to card view mode
-- This updates all existing lists to use the 'card' view mode instead of 'row'

-- Update all lists to use card view
UPDATE lists
SET view_mode = 'card'
WHERE view_mode = 'row' OR view_mode IS NULL;
