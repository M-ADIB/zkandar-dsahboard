-- =============================================
-- PROGRAM OFFERINGS (SPRINT WORKSHOP / MASTER CLASS)
-- =============================================

DO $$ BEGIN
    CREATE TYPE offering_type AS ENUM ('sprint_workshop', 'master_class');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE cohorts
    ADD COLUMN IF NOT EXISTS offering_type offering_type NOT NULL DEFAULT 'master_class';

CREATE INDEX IF NOT EXISTS idx_cohorts_offering_type ON cohorts(offering_type);
