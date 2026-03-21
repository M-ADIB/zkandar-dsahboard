-- Create the submissions storage bucket for file uploads in SubmitAssignmentModal.
-- Public so getPublicUrl() works without signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions',
    'submissions',
    true,
    52428800,  -- 50 MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
DO $$ BEGIN
    CREATE POLICY "Members can upload submissions"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to read all submission files (admins need this too)
DO $$ BEGIN
    CREATE POLICY "Authenticated users can read submissions"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'submissions');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
