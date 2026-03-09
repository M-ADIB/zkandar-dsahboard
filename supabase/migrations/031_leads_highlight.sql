-- ============================================================
-- 031_leads_highlight.sql
-- Add is_highlighted column to leads and migrate HOT to LAVA
-- ============================================================

-- Add highlighting support
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;

-- Migrate existing HOT leads to LAVA
UPDATE public.leads 
SET priority = 'LAVA' 
WHERE priority = 'HOT';
