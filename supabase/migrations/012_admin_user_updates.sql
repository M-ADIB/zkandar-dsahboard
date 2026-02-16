-- =============================================
-- ALLOW ADMIN/OWNER USER UPDATES
-- =============================================

CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT role IN ('owner', 'admin')
    INTO is_admin
    FROM public.users
   WHERE id = auth.uid();

  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role.';
  END IF;

  IF OLD.company_id IS NOT NULL AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'You cannot change your company once set.';
  END IF;

  IF OLD.onboarding_completed IS TRUE AND NEW.onboarding_completed IS FALSE THEN
    RAISE EXCEPTION 'Cannot revert onboarding status.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
