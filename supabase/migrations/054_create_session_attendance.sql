-- session_attendance was referenced in code and had RLS policies defined in migration 024,
-- but the table itself was never created in any migration.
-- Every query to this table (MyProgramPage, WorkspaceAttendance) was silently failing.

CREATE TABLE IF NOT EXISTS public.session_attendance (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, user_id)
);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Members can read their own attendance records
CREATE POLICY "session_attendance_read_own"
    ON public.session_attendance FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Admins can manage all attendance (mark present/absent)
CREATE POLICY "session_attendance_admin_all"
    ON public.session_attendance FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );
