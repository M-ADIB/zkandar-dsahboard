-- Migration: Email Command Center tables
-- Creates email_templates, email_campaigns, email_campaign_recipients, email_queue

-- ── email_templates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    headline TEXT,
    body TEXT NOT NULL DEFAULT '',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    cta_text TEXT,
    cta_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_email_templates"
    ON public.email_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    );

-- ── email_campaigns ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    headline TEXT,
    body TEXT NOT NULL DEFAULT '',
    html_preview TEXT,
    audience TEXT NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'sent'
        CHECK (status IN ('sent', 'scheduled', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_email_campaigns"
    ON public.email_campaigns
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    );

-- ── email_campaign_recipients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecr_campaign ON public.email_campaign_recipients(campaign_id);

ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_email_campaign_recipients"
    ON public.email_campaign_recipients
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    );

-- ── email_queue ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
    attempts INTEGER NOT NULL DEFAULT 0,
    send_after TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eq_status_send ON public.email_queue(status, send_after);
CREATE INDEX IF NOT EXISTS idx_eq_campaign ON public.email_queue(campaign_id);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_email_queue"
    ON public.email_queue
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin'))
    );

-- Allow service_role full access to email_queue (for edge function processing)
CREATE POLICY "service_role_email_queue"
    ON public.email_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ── Updated-at trigger for email_templates ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- ── Updated-at trigger for email_queue ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_updated_at();
