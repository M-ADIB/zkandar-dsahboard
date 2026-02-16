-- =============================================
-- REQUIRE COMPANY FOR MASTER CLASS MEMBERSHIPS
-- =============================================

CREATE OR REPLACE FUNCTION public.require_company_for_master_class()
RETURNS TRIGGER AS $$
DECLARE
    cohort_offering offering_type;
    company_id uuid;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT offering_type INTO cohort_offering
      FROM public.cohorts
     WHERE id = NEW.cohort_id;

    IF cohort_offering = 'master_class' THEN
        SELECT company_id INTO company_id
          FROM public.users
         WHERE id = NEW.user_id;

        IF company_id IS NULL THEN
            RAISE EXCEPTION 'Company is required for master class membership.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'require_company_for_master_class_trigger'
    ) THEN
        CREATE TRIGGER require_company_for_master_class_trigger
        BEFORE INSERT OR UPDATE ON public.cohort_memberships
        FOR EACH ROW
        EXECUTE FUNCTION public.require_company_for_master_class();
    END IF;
END $$;
