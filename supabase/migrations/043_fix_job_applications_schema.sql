-- Fix job_applications schema to match the actual form fields
-- instagram_url and gender were added via earlier dashboard migrations
-- but need to be ensured for completeness.
-- compensation_model does not exist in the live DB (was removed in earlier migrations).

-- Add instagram_url column if not already present
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add gender column if not already present
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS gender TEXT;
