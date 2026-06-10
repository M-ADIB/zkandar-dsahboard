-- Migration 20260610: Create masterclass_proposals table and agreements storage bucket

CREATE TABLE IF NOT EXISTS public.masterclass_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    prepared_for TEXT NOT NULL,
    company_name TEXT NOT NULL,
    prepared_by TEXT NOT NULL DEFAULT 'Zkandar L.L.C',
    total_investment INTEGER NOT NULL DEFAULT 120000,
    agreement_pdf_url TEXT,
    duration TEXT NOT NULL DEFAULT '2 Sessions (15 Hours total) + 3rd Dedicated troubleshooting session (scheduled post-masterclass).',
    delivery_format TEXT NOT NULL DEFAULT 'In-Person at your studio.',
    team_capacity TEXT NOT NULL DEFAULT 'Up to 20 Participants.',
    session_style TEXT NOT NULL DEFAULT 'Hands-On / Interactive / On-screen presentation.',
    recommended_audience TEXT[] DEFAULT ARRAY[
        'Architects', 
        'Interior Designers', 
        'FF&E Teams', 
        'Visualization Teams', 
        'Design Directors', 
        'Creative Leads', 
        'Marketing Teams', 
        'Concept Development Teams'
    ]::TEXT[],
    modules JSONB NOT NULL DEFAULT '[]'::JSONB,
    whats_included TEXT[] DEFAULT ARRAY[
        'Custom case studies specific to your projects',
        'Lifetime access to all session recordings',
        'Free e-prompt books and template kits',
        '60-day AI community support access',
        '3 hours of dedicated post-masterclass troubleshooting support',
        'Data-driven workflow analysis reports'
    ]::TEXT[],
    expected_outcomes TEXT[] DEFAULT ARRAY[
        'Successful integration of AI workflows into daily studio operations',
        'Drastically reduced concept-to-presentation timelines',
        'Significantly improved design storytelling capabilities',
        'Consistently higher-quality and more controlled creative outputs',
        'repeatable, step-by-step systems established for the team',
        'Stronger client pitch and presentation confidence'
    ]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.masterclass_proposals ENABLE ROW LEVEL SECURITY;

-- 1. Public SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'masterclass_proposals'
    AND policyname = 'Allow public read access to masterclass_proposals'
  ) THEN
    CREATE POLICY "Allow public read access to masterclass_proposals"
    ON public.masterclass_proposals FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- 2. Admin CRUD policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'masterclass_proposals'
    AND policyname = 'Allow admin crud access to masterclass_proposals'
  ) THEN
    CREATE POLICY "Allow admin crud access to masterclass_proposals"
    ON public.masterclass_proposals FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin')
      )
    );
  END IF;
END $$;

-- Create public storage bucket for agreements (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on agreements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public read agreements'
  ) THEN
    CREATE POLICY "Public read agreements"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'agreements');
  END IF;
END $$;

-- Allow admins (owner/admin role) to upload and manage agreement PDFs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins manage agreements'
  ) THEN
    CREATE POLICY "Admins manage agreements"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
      bucket_id = 'agreements'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
    WITH CHECK (
      bucket_id = 'agreements'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
      )
    );
  END IF;
END $$;
