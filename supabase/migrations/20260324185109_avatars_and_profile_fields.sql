-- Add avatar_url directly to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Storage RLS Policies for the avatars bucket
-- 1. Allow public access to view avatars
CREATE POLICY "Public Access to Avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- 2. Allow authenticated users to upload their own avatar
-- A user will upload under "avatars/[user_id].ext", so we check if the path starts with their UUID
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);
