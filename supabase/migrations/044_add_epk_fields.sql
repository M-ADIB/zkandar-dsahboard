-- Migration 044: Add EPK (Electronic Press Kit) fields to event_requests table
-- and create the epk-assets storage bucket for headshots and flyers

ALTER TABLE event_requests
  ADD COLUMN IF NOT EXISTS epk_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS epk_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS epk_talk_title text,
  ADD COLUMN IF NOT EXISTS epk_bio text,
  ADD COLUMN IF NOT EXISTS epk_flyer_url text,
  ADD COLUMN IF NOT EXISTS epk_host_provides_flyer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS epk_headshot_url text,
  ADD COLUMN IF NOT EXISTS epk_speaker_name text,
  ADD COLUMN IF NOT EXISTS epk_speaker_title text,
  ADD COLUMN IF NOT EXISTS epk_company text,
  ADD COLUMN IF NOT EXISTS epk_instagram text;

-- Create public storage bucket for EPK assets (headshots + flyers)
INSERT INTO storage.buckets (id, name, public)
VALUES ('epk-assets', 'epk-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on EPK assets (required for the public /epk/:slug page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public read EPK assets'
  ) THEN
    CREATE POLICY "Public read EPK assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'epk-assets');
  END IF;
END $$;

-- Allow admins (owner/admin role) to upload and manage EPK assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins manage EPK assets'
  ) THEN
    CREATE POLICY "Admins manage EPK assets"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
      bucket_id = 'epk-assets'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
    WITH CHECK (
      bucket_id = 'epk-assets'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
      )
    );
  END IF;
END $$;
