-- Fix leads display issues:
-- 1. Hide the record_id column (Bug 1)
-- 2. Reorder columns so full_name (NAME) is the first visible column (Bug 2)
-- 3. Add options JSONB field to lead_columns for dropdown column support (Feature 1)

-- Hide record_id — data stays in the row but the column never renders
UPDATE lead_columns SET visible = false WHERE key = 'record_id';

-- Swap full_name and priority so NAME comes before PRIORITY in the table
UPDATE lead_columns SET order_index = 1 WHERE key = 'full_name';
UPDATE lead_columns SET order_index = 2 WHERE key = 'priority';

-- Add options field for dropdown column definitions
ALTER TABLE lead_columns ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
