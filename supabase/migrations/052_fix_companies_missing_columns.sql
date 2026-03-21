-- The live DB companies table is missing columns that were defined in migration 001
-- but never applied (or were dropped by remote migrations 040–044).
-- This migration adds every expected column idempotently.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cohort_id UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS executive_user_id UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;

-- Restore FK for executive_user_id → users (ON DELETE SET NULL so deleting a user
-- doesn't cascade-delete the company)
DO $$ BEGIN
    ALTER TABLE public.companies
        ADD CONSTRAINT companies_executive_user_id_fkey
        FOREIGN KEY (executive_user_id) REFERENCES public.users(id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Restore FK for cohort_id → cohorts (ON DELETE SET NULL, same as migration 039)
DO $$ BEGIN
    ALTER TABLE public.companies
        ADD CONSTRAINT companies_cohort_id_fkey
        FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
