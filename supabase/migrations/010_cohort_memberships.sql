-- =============================================
-- COHORT MEMBERSHIPS (MULTI-PROGRAM SUPPORT)
-- =============================================

CREATE TABLE IF NOT EXISTS cohort_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_memberships_user ON cohort_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_memberships_cohort ON cohort_memberships(cohort_id);

ALTER TABLE cohort_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_view_own" ON cohort_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "memberships_manage_admin" ON cohort_memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
