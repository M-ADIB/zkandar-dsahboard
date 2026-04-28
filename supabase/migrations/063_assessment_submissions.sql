CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    answers         JSONB       NOT NULL DEFAULT '{}',
    readiness_score INT         NOT NULL,
    path_result     TEXT        NOT NULL CHECK (path_result IN ('sprint', 'masterclass')),
    context         TEXT,
    team_size       TEXT
);

ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_assessment"
    ON public.assessment_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "admin_read_assessment"
    ON public.assessment_submissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );
