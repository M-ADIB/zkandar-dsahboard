-- Add status + prompt_text columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS prompt_text TEXT;

-- Make submissions bucket public so file URLs work without signed tokens
UPDATE storage.buckets SET public = true WHERE id = 'submissions';
