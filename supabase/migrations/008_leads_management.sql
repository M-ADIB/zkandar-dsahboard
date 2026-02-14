-- Migration: Create Leads Management System
-- Description: Self-contained leads/pipeline tracking without external CRM

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contact Info
    record_id TEXT UNIQUE, -- Reference ID from external sources
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    instagram TEXT,
    company_name TEXT,
    job_title TEXT,
    country TEXT,
    city TEXT,
    description TEXT,
    
    -- Deal Info
    priority TEXT CHECK (priority IN ('ACTIVE', 'HOT', 'COLD', 'LAVA', 'COMPLETED', 'NOT INTERESTED')),
    discovery_call_date DATE,
    offering_type TEXT, -- 'Sprint Workshop', '5-Week Masterclass', 'Data Analytics', etc.
    session_type TEXT, -- 'SW 1', 'SW 2', 'PVT', etc.
    
    -- Financial
    payment_amount DECIMAL(10,2),
    seats INTEGER DEFAULT 1,
    balance DECIMAL(10,2),
    balance_2 DECIMAL(10,2),
    coupon_percent INTEGER,
    coupon_code TEXT,
    paid_deposit BOOLEAN DEFAULT false,
    amount_paid DECIMAL(10,2),
    amount_paid_2 DECIMAL(10,2),
    date_of_payment DATE,
    date_of_payment_2 DATE,
    date_of_payment_3 DATE,
    payment_plan TEXT,
    paid_full BOOLEAN DEFAULT false,
    balance_dop DATE,
    
    -- Schedule
    day_slot TEXT,
    time_slot TEXT,
    start_date DATE,
    end_date DATE,
    sessions_done INTEGER DEFAULT 0,
    
    -- Support
    booked_support TEXT,
    support_date_booked DATE,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    priority_changed_at TIMESTAMPTZ,
    priority_previous_values TEXT[],
    
    -- Ownership
    owner_id UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_offering_type ON leads(offering_type);
CREATE INDEX IF NOT EXISTS idx_leads_discovery_call_date ON leads(discovery_call_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(full_name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Owners and admins can view all leads
CREATE POLICY "Admins can view all leads"
ON leads FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Policy: Owners and admins can insert leads
CREATE POLICY "Admins can insert leads"
ON leads FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Policy: Owners and admins can update leads
CREATE POLICY "Admins can update leads"
ON leads FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Policy: Owners and admins can delete leads
CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();

-- Add comments for documentation
COMMENT ON TABLE leads IS 'Leads and pipeline management for sales tracking';
COMMENT ON COLUMN leads.priority IS 'Lead status: ACTIVE, HOT, COLD, LAVA, COMPLETED, NOT INTERESTED';
COMMENT ON COLUMN leads.offering_type IS 'Type of offering: Sprint Workshop, 5-Week Masterclass, Data Analytics, etc.';
COMMENT ON COLUMN leads.payment_amount IS 'Total payment amount for the deal';
COMMENT ON COLUMN leads.seats IS 'Number of seats/participants in the deal';
