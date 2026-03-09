-- ============================================================
-- 034_audit_logs.sql
-- Admin action audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,          -- e.g. 'lead.update', 'user.deactivate'
    entity_type TEXT        NOT NULL,          -- e.g. 'lead', 'user', 'company'
    entity_id   TEXT,                          -- ID of the affected record
    metadata    JSONB,                         -- additional context
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient per-user and per-entity lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id   ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity    ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created   ON audit_logs (created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can read audit logs
CREATE POLICY "Admins can read audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('owner', 'admin')
        )
    );

-- Authenticated users can insert their own audit events
CREATE POLICY "Users can insert own audit events"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
