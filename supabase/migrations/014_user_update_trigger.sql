-- =============================================
-- USER UPDATE GUARD TRIGGER
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'protect_user_fields_trigger'
    ) THEN
        CREATE TRIGGER protect_user_fields_trigger
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION public.protect_user_fields();
    END IF;
END $$;
