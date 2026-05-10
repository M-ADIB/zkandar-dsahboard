-- Events table for Zkandar public events & collaborations
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  venue text,
  description text,
  event_date timestamptz,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past', 'cancelled')),
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view events on the landing page)
CREATE POLICY "events_public_read" ON public.events
  FOR SELECT USING (true);

-- Only authenticated users with admin/owner roles can modify
CREATE POLICY "events_admin_write" ON public.events
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('owner', 'admin')
    )
  );
