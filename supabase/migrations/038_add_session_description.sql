-- Add description / agenda column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;
