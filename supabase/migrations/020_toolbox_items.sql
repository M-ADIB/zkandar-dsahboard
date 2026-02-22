-- Create Enums
DO $$ BEGIN
  CREATE TYPE toolbox_importance AS ENUM ('essential', 'recommended', 'optional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE toolbox_tool_type AS ENUM ('image_generation', 'video_generation', 'text_generation', 'automation', 'analytics', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Table
CREATE TABLE IF NOT EXISTS public.toolbox_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    url text NOT NULL,
    description text,
    importance toolbox_importance NOT NULL DEFAULT 'optional',
    category text NOT NULL,
    tool_type toolbox_tool_type NOT NULL DEFAULT 'other',
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.toolbox_items ENABLE ROW LEVEL SECURITY;

-- Reading policy: All authenticated users can read (or we could restrict to is_active = true for non-admins, but matching our standard policies)
CREATE POLICY "Enable read access for authenticated users" ON public.toolbox_items
    FOR SELECT TO authenticated USING (true);

-- Admin policy: Owners and admins can do all CRUD
CREATE POLICY "Enable all access for owners and admins" ON public.toolbox_items
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('owner', 'admin')
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_toolbox_items_updated_at ON public.toolbox_items;
CREATE TRIGGER update_toolbox_items_updated_at
    BEFORE UPDATE ON public.toolbox_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
