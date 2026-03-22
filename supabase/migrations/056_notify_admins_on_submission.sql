-- When a member submits an assignment, insert a notification for every admin/owner.
-- SECURITY DEFINER lets this run as the function owner (bypassing the RLS policy
-- that restricts notification inserts to admin users only).

CREATE OR REPLACE FUNCTION public.notify_admins_on_submission()
RETURNS TRIGGER AS $$
DECLARE
    member_name  TEXT;
    assign_title TEXT;
BEGIN
    SELECT full_name  INTO member_name  FROM public.users       WHERE id = NEW.user_id       LIMIT 1;
    SELECT title      INTO assign_title FROM public.assignments  WHERE id = NEW.assignment_id LIMIT 1;

    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    SELECT
        u.id,
        'New Submission',
        COALESCE(member_name, 'A member') || ' submitted "' || COALESCE(assign_title, 'an assignment') || '"',
        'info',
        '/admin/assignments'
    FROM public.users u
    WHERE u.role IN ('owner', 'admin');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Idempotent: drop before re-creating
DROP TRIGGER IF EXISTS on_submission_created ON public.submissions;

CREATE TRIGGER on_submission_created
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_submission();
