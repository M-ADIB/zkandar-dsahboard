-- Migration: Create job_applications table for recruiting pipeline

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Position
  position_type text NOT NULL DEFAULT 'sales_closer',

  -- Step 1: Contact Info
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linkedin_url text,
  country text NOT NULL,
  timezone text NOT NULL,

  -- Step 2: Experience
  compensation_model text NOT NULL,
  years_experience text NOT NULL,
  sold_info_products text NOT NULL,
  avg_deal_size text NOT NULL,
  crm_tools text[] NOT NULL DEFAULT '{}',
  expected_monthly_earnings text,

  -- Open-ended
  best_close_story text,
  why_zkandar text,
  video_intro_url text,

  -- Admin
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),

  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (external form, no auth required)
CREATE POLICY "Allow public insert to job_applications"
  ON job_applications
  FOR INSERT
  WITH CHECK (true);

-- Only admins/owners can read
CREATE POLICY "Allow admins to read job_applications"
  ON job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Only admins/owners can update (status, notes)
CREATE POLICY "Allow admins to update job_applications"
  ON job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Index for common queries
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_position_type ON job_applications(position_type);
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at DESC);
