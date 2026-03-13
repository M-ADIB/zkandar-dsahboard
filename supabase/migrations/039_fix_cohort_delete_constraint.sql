-- Fix companies -> cohorts constraint
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_cohort_id_fkey;
ALTER TABLE companies ADD CONSTRAINT companies_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;

-- Fix chat_messages -> cohorts constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_cohort_id_fkey;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;

-- Add "any" to submission format
ALTER TYPE submission_format ADD VALUE IF NOT EXISTS 'any';
ALTER TABLE assignments ALTER COLUMN submission_format SET DEFAULT 'any';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;
