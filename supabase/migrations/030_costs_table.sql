-- ============================================================
-- 030_costs_table.sql
-- Creates the costs table for tracking salaries, AI subscriptions, and contractors
-- ============================================================

CREATE TABLE IF NOT EXISTS public.costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('salary', 'ai_subscription', 'contractor')),
    invoice_date DATE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_costs"
    ON public.costs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
              AND u.role IN ('owner', 'admin')
        )
    );
