-- Restore correct column order: Priority must render before Name
-- Migration 040 placed full_name at order_index=1 and priority at order_index=2
-- to fix a previous issue, but the required display order is Priority → Name.
-- This migration corrects that so the sticky-column offsets work correctly.

UPDATE lead_columns SET order_index = 1 WHERE key = 'priority';
UPDATE lead_columns SET order_index = 2 WHERE key = 'full_name';
