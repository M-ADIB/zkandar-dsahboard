-- =============================================
-- SECURITY HARDENING
-- =============================================

-- 1. Protect sensitive columns in users table from self-updates
--    Even with RLS "Users can update own profile", we want to prevent
--    users from changing their role or company_id after assignment.

CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing role (Self-promotion prevention)
  -- Allow if it's the same (idempotent updates)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role.';
  END IF;

  -- Prevent changing company_id if it was already set
  -- Users are assigned a company during onboarding or invite.
  -- They shouldn't be able to switch companies freely.
  IF OLD.company_id IS NOT NULL AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'You cannot change your company once set.';
  END IF;

  -- Prevent un-completing onboarding
  IF OLD.onboarding_completed IS TRUE AND NEW.onboarding_completed IS FALSE THEN
    RAISE EXCEPTION 'Cannot revert onboarding status.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotent migration
DROP TRIGGER IF EXISTS on_user_self_update_protection ON public.users;

-- Apply trigger
CREATE TRIGGER on_user_self_update_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_fields();

-- 2. Ensure RLS is enabled on potentially missed tables (defensive)
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cohorts ENABLE ROW LEVEL SECURITY;

-- 3. Add policy for Admins/Owners to update other users (if missing)
--    The initial schema only had "Users can update own profile".
--    We need to allow Admins to manage users in their company.

DROP POLICY IF EXISTS "Admins can update company users" ON users;

CREATE POLICY "Admins can update company users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users as requestor
      WHERE requestor.id = auth.uid()
      AND requestor.company_id = users.company_id
      AND requestor.role IN ('owner', 'admin')
    )
  );
