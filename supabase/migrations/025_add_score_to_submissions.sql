-- Add score column to submissions for admin grading
ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT NULL;

-- Add a check constraint to ensure score is 0-100
ALTER TABLE submissions
    ADD CONSTRAINT submissions_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100));
