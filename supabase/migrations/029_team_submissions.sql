-- Migration: team_submissions
-- Pre-masterclass survey responses from team/staff members

CREATE TABLE IF NOT EXISTS public.team_submissions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_email      TEXT        NOT NULL,
    full_name       TEXT,
    company_name    TEXT,
    company_id      UUID,

    -- Survey questions
    q1_role                                 TEXT,
    q1_role_other                           TEXT,
    q2_experience_years                     TEXT,
    q3_ai_usage                             TEXT,
    q4_ai_tools                             TEXT[],
    q5_confidence_ai_workflow               INTEGER,
    q6_skill_level_ai_tools                 INTEGER,
    q7_difficulty_areas                     TEXT[],
    q8_outputs_meet_standards_confidence    INTEGER,
    q9_concerns                             TEXT[],
    q10_help_most                           TEXT,
    q11_readiness                           INTEGER,
    q12_top_goals                           TEXT[],
    q13_success_definition                  TEXT
);

-- Enable RLS
ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can INSERT — public survey, no auth required
CREATE POLICY "anon_insert_team_submissions"
    ON public.team_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins and owners can SELECT
CREATE POLICY "admin_read_team_submissions"
    ON public.team_submissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );

-- Only admins and owners can UPDATE
CREATE POLICY "admin_update_team_submissions"
    ON public.team_submissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );
