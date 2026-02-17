-- =============================================
-- SEED COMPANIES FOR ONBOARDING
-- =============================================

INSERT INTO companies (name)
VALUES
  ('Reviespaces'),
  ('Finasi'),
  ('Knowndesign')
ON CONFLICT DO NOTHING;
