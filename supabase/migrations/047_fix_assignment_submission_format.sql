-- Migration 039 set the column DEFAULT to 'any' but never added 'any' to the
-- submission_format ENUM (or CHECK constraint). This migration explicitly resets
-- the constraint to include all four valid values.

-- Normalize any rows with out-of-range values to 'any'.
UPDATE assignments
SET submission_format = 'any'
WHERE submission_format NOT IN ('file', 'link', 'text', 'any');

-- If the column is still an ENUM type, cast it to plain TEXT first.
DO $$ BEGIN
    ALTER TABLE assignments ALTER COLUMN submission_format TYPE TEXT USING submission_format::text;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Drop the existing constraint (whatever values it currently has).
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_submission_format_check;

-- Re-create with all valid values including 'any'.
ALTER TABLE assignments
    ADD CONSTRAINT assignments_submission_format_check
    CHECK (submission_format IN ('file', 'link', 'text', 'any'));
