-- Migration: post_completion_survey_responses
-- Post-completion survey responses table
CREATE TABLE IF NOT EXISTS public.post_completion_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_type TEXT NOT NULL CHECK (survey_type IN ('team', 'management')),
    respondent_name TEXT,
    respondent_email TEXT,
    company_name TEXT,
    answers JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.post_completion_survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to INSERT — public survey, no auth required
CREATE POLICY "anon_insert_post_survey"
    ON public.post_completion_survey_responses
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins and owners can SELECT
CREATE POLICY "admin_read_post_survey"
    ON public.post_completion_survey_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );
