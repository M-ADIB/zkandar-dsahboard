-- =============================================
-- RLS ACCESS VIA COHORT MEMBERSHIPS
-- =============================================

-- Cohorts: members can view cohorts they are enrolled in
CREATE POLICY "cohorts_view_membership" ON cohorts
  FOR SELECT USING (
    id IN (SELECT cohort_id FROM cohort_memberships WHERE user_id = auth.uid())
  );

-- Sessions: members can view sessions for cohorts they are enrolled in
CREATE POLICY "sessions_view_membership" ON sessions
  FOR SELECT USING (
    cohort_id IN (SELECT cohort_id FROM cohort_memberships WHERE user_id = auth.uid())
  );

-- Assignments: members can view assignments for their cohort sessions
CREATE POLICY "assignments_view_membership" ON assignments
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE cohort_id IN (SELECT cohort_id FROM cohort_memberships WHERE user_id = auth.uid())
    )
  );

-- Chat: members can view cohort chats for enrolled cohorts
CREATE POLICY "chat_view_membership" ON chat_messages
  FOR SELECT USING (
    cohort_id IN (SELECT cohort_id FROM cohort_memberships WHERE user_id = auth.uid())
  );
