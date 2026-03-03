-- Migration: Create event_requests table

CREATE TABLE IF NOT EXISTS event_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Step 1 Basics
  full_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  role_title text NOT NULL,
  event_type text NOT NULL,
  proposed_date text NOT NULL,
  venue text NOT NULL,
  audience_size integer NOT NULL,
  event_description text NOT NULL,
  
  -- Step 2 Logistics
  session_format text NOT NULL,
  duration text NOT NULL,
  has_moderator boolean NOT NULL,
  has_qa boolean NOT NULL,
  available_tech text[] NOT NULL,
  vip_notes text,
  marketing_flyer text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  other_notes text,
  
  -- Admin status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'done')),
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Allow public insert to event_requests"
  ON event_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to event_requests"
  ON event_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );
