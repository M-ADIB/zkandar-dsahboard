-- Create webinar_analytics table to track page views and session durations
CREATE TABLE IF NOT EXISTS public.webinar_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    path text NOT NULL,
    referrer text NOT NULL,
    variant text NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index key columns for performance
CREATE INDEX IF NOT EXISTS webinar_analytics_session_id_idx ON public.webinar_analytics (session_id);
CREATE INDEX IF NOT EXISTS webinar_analytics_path_idx ON public.webinar_analytics (path);
CREATE INDEX IF NOT EXISTS webinar_analytics_created_at_idx ON public.webinar_analytics (created_at);

-- Enable RLS
ALTER TABLE public.webinar_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public tracking)
CREATE POLICY "Allow public insert to webinar_analytics" ON public.webinar_analytics
    FOR INSERT WITH CHECK (true);

-- Allow anonymous updates of duration (public heartbeat updates)
CREATE POLICY "Allow public update to webinar_analytics" ON public.webinar_analytics
    FOR UPDATE USING (true) WITH CHECK (true);

-- Allow admins/owners full select access
CREATE POLICY "Allow admins select on webinar_analytics" ON public.webinar_analytics
    FOR SELECT TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role IN ('owner', 'admin')
        )
    );
