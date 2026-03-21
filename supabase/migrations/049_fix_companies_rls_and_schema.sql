-- Add country column (migration 033 was not applied to live DB)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country TEXT;

-- Drop existing companies RLS policies (remote migrations 040-044 may have altered them,
-- causing UPDATE to silently return 0 rows for owner/admin users).
DROP POLICY IF EXISTS "companies_view_own" ON companies;
DROP POLICY IF EXISTS "companies_manage_admin" ON companies;

-- Recreate SELECT policy: user sees their own company, admins see all, new users see all (onboarding)
CREATE POLICY "companies_view_own" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND onboarding_completed = false)
  );

-- Recreate ALL-operations policy: owner/admin can INSERT, UPDATE, DELETE any company
CREATE POLICY "companies_manage_admin" ON companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
