-- Add optional Vimeo embed URL to toolbox items
ALTER TABLE public.toolbox_items
    ADD COLUMN IF NOT EXISTS vimeo_url TEXT;
