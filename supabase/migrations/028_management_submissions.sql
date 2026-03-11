-- Migration: management_submissions
-- Pre-masterclass survey responses from management/leadership roles

CREATE TABLE IF NOT EXISTS public.management_submissions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_email      TEXT        NOT NULL,
    full_name       TEXT,
    company_name    TEXT,
    company_id      UUID,

    -- Survey questions
    q1_role                             TEXT,
    q2_studio_focus                     TEXT,
    q3_ai_adoption_status               TEXT,
    q4_visibility                       INTEGER,
    q5_opportunities                    TEXT[],
    q6_risks                            TEXT[],
    q7_alignment_confidence             INTEGER,
    q8_guidance_level                   TEXT,
    q9_success_factor                   TEXT,
    q10_team_readiness                  INTEGER,
    q11_impact_speed                    INTEGER,
    q11_impact_quality                  INTEGER,
    q11_impact_efficiency               INTEGER,
    q11_impact_client_satisfaction      INTEGER,
    q11_impact_competitive_advantage    INTEGER,
    q12_objectives                      TEXT[],
    q13_success_definition              TEXT
);

-- Enable RLS
ALTER TABLE public.management_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can INSERT — public survey, no auth required
CREATE POLICY "anon_insert_management_submissions"
    ON public.management_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins and owners can SELECT
CREATE POLICY "admin_read_management_submissions"
    ON public.management_submissions
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
CREATE POLICY "admin_update_management_submissions"
    ON public.management_submissions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );
