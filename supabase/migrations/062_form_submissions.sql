-- Form submissions: public intake form at /submit-form
CREATE TABLE IF NOT EXISTS form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    role            TEXT,
    interest        TEXT NOT NULL CHECK (interest IN ('masterclass', 'sprint', 'other')),
    interest_other  TEXT,
    commitment      TEXT NOT NULL CHECK (commitment IN ('ready', 'curious', 'exploring')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public insert)
CREATE POLICY "form_submissions_public_insert"
    ON form_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins can read
CREATE POLICY "form_submissions_admin_select"
    ON form_submissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'admin'
        )
    );
