-- Admin/Owner full CRUD on sessions, assignments, submissions, session_attendance
-- (cohorts already had INSERT/UPDATE/DELETE from a previous migration)

-- ── COHORTS: Admin SELECT all ──
CREATE POLICY "Admins can read all cohorts"
  ON public.cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ── SESSIONS ──
CREATE POLICY "Admins can insert sessions"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can update sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can delete sessions"
  ON public.sessions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can read all sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ── ASSIGNMENTS ──
CREATE POLICY "Admins can insert assignments"
  ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can update assignments"
  ON public.assignments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can delete assignments"
  ON public.assignments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can read all assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ── SUBMISSIONS ──
CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Users can insert own submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── SESSION_ATTENDANCE ──
CREATE POLICY "Admins can manage attendance"
  ON public.session_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Users can read own attendance"
  ON public.session_attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid());
