-- =============================================
-- ALLOW COMPANY LOOKUP DURING ONBOARDING
-- =============================================

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('management', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS user_type user_type;

DROP POLICY IF EXISTS "companies_view_own" ON companies;

CREATE POLICY "companies_view_own" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND onboarding_completed = false)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type IS NULL)
  );
