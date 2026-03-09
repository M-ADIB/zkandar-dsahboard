-- Migration for lead columns and new fields
CREATE TABLE lead_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    is_custom BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users on lead_columns"
    ON lead_columns FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add custom fields and missing fields to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS has_coupon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_payment_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS balance_dop TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_full BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_of_payment_3 TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS amount_paid_3 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Seed initial data for lead_columns to exactly match AI Masterclass.xlsx
INSERT INTO lead_columns (key, label, type, is_custom, visible, order_index) VALUES
('record_id', 'ID', 'text', false, true, 0),
('priority', 'PRIORITY', 'select', false, true, 1),
('full_name', 'NAME', 'text', false, true, 2),
('email', 'EMAIL', 'text', false, true, 3),
('phone', 'NUMBER', 'text', false, true, 4),
('job_title', 'PROFESSION', 'text', false, true, 5),
('company_name', 'COMPANY', 'text', false, true, 6),
('country', 'LOCATION', 'text', false, true, 7),
('instagram', 'INSTAGRAM', 'text', false, true, 8),
('discovery_call_date', 'ZOOM DATE', 'date', false, true, 9),
('offering_type', 'OFFERING TYPE', 'select', false, true, 10),
('session_type', 'PART', 'text', false, true, 11),
('payment_amount', 'PAYMENT', 'number', false, true, 12),
('has_coupon', 'COUPON', 'boolean', false, true, 13),
('coupon_percent', 'COUPON %', 'number', false, true, 14),
('coupon_code', 'CODE', 'text', false, true, 15),
('seats', '#SEATS', 'number', false, true, 16),
('paid_deposit', 'PAID DEPOSIT', 'boolean', false, true, 17),
('amount_paid', 'AMOUNT PAID', 'number', false, true, 18),
('date_of_payment', 'DOP', 'date', false, true, 19),
('is_payment_plan', 'PAID PLAN', 'boolean', false, true, 20),
('amount_paid_2', 'AMOUNT PAID 2', 'number', false, true, 21),
('date_of_payment_2', 'DOP 2', 'date', false, true, 22),
('balance', 'BALANCE', 'number', false, true, 23),
('balance_dop', 'BALANCE DOP', 'date', false, true, 24),
('paid_full', 'PAID FULL', 'boolean', false, true, 25),
('date_of_payment_3', 'DOP 3', 'date', false, true, 26),
('day_slot', 'DAY SLOT', 'text', false, true, 27),
('time_slot', 'TIME SLOT', 'text', false, true, 28),
('start_date', 'START DATE', 'date', false, true, 29),
('end_date', 'END DATE', 'date', false, true, 30),
('sessions_done', 'SESSIONS DONE', 'number', false, true, 31),
('booked_support', 'BOOKED SUPPORT', 'boolean', false, true, 32),
('support_date_booked', 'DATE BOOKED', 'date', false, true, 33),
('notes', 'REMARKS', 'text', false, true, 34)
ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    order_index = EXCLUDED.order_index;
