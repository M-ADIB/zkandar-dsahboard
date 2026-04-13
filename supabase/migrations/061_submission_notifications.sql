-- Trigger: notify all admins/owners when a new submission is inserted
CREATE OR REPLACE FUNCTION notify_admins_on_submission()
RETURNS trigger AS $$
DECLARE
    assignment_title TEXT;
    submitter_name   TEXT;
    admin_rec        RECORD;
BEGIN
    SELECT title     INTO assignment_title FROM assignments WHERE id = NEW.assignment_id;
    SELECT full_name INTO submitter_name   FROM users       WHERE id = NEW.user_id;

    FOR admin_rec IN
        SELECT id FROM users
        WHERE role = ANY (ARRAY['owner'::user_role, 'admin'::user_role])
    LOOP
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (
            admin_rec.id,
            'New Submission',
            COALESCE(submitter_name, 'A participant') || ' submitted "'
                || COALESCE(assignment_title, 'an assignment') || '"',
            'info',
            '/admin/programs'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_submission_insert ON submissions;
CREATE TRIGGER on_submission_insert
    AFTER INSERT ON submissions
    FOR EACH ROW EXECUTE FUNCTION notify_admins_on_submission();
