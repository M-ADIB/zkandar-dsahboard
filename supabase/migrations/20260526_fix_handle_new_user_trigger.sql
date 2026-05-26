-- Fix handle_new_user function to not attempt inserting non-existent 'role' column in cohort_memberships and add secure search_path for GoTrue execution context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, user_type, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'participant'::public.user_role),
    (NEW.raw_user_meta_data->>'user_type')::public.user_type,
    (NEW.raw_user_meta_data->>'company_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-assign to cohort if provided
  IF NEW.raw_user_meta_data->>'cohort_id' IS NOT NULL THEN
    INSERT INTO public.cohort_memberships (user_id, cohort_id)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'cohort_id')::uuid
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
