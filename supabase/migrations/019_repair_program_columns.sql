-- =============================================
-- REPAIR MISSING PROGRAM COLUMNS
-- =============================================

-- Ensure companies.cohort_id exists
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS cohort_id UUID;

DO $$ BEGIN
    ALTER TABLE companies
        ADD CONSTRAINT companies_cohort_id_fkey
        FOREIGN KEY (cohort_id) REFERENCES cohorts(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure sessions.scheduled_date exists
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sessions'
          AND column_name = 'created_at'
    ) THEN
        EXECUTE 'UPDATE sessions SET scheduled_date = COALESCE(scheduled_date, created_at, NOW()) WHERE scheduled_date IS NULL';
    ELSE
        EXECUTE 'UPDATE sessions SET scheduled_date = COALESCE(scheduled_date, NOW()) WHERE scheduled_date IS NULL';
    END IF;
END $$;

ALTER TABLE sessions
    ALTER COLUMN scheduled_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_cohort ON companies(cohort_id);
