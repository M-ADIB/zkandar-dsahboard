-- =============================================
-- MOCK DATA (DEV ONLY)
-- =============================================

-- Insert companies
INSERT INTO companies (name, industry, team_size)
VALUES
  ('Finasi', 'Interior Design', 12),
  ('Revie Homes', 'Architecture', 8),
  ('Known Design', 'Interior Design', 15)
ON CONFLICT (name) DO NOTHING;

-- Insert mock users only if auth.users exists for the email
WITH seed_users AS (
  SELECT * FROM (VALUES
    ('Finasi', 'sarah@finasi.com', 'Sarah Johnson', 'owner', 'management'),
    ('Finasi', 'mike@finasi.com', 'Mike Chen', 'admin', 'management'),
    ('Finasi', 'dev@finasi.com', 'Dev Team', 'participant', 'team'),
    ('Revie Homes', 'john@revie.com', 'John Smith', 'owner', 'management'),
    ('Revie Homes', 'design@revie.com', 'Design Team', 'participant', 'team'),
    ('Known Design', 'alex@known.com', 'Alex Doe', 'owner', 'management')
  ) AS data(company_name, email, full_name, role_val, type_val)
)
INSERT INTO users (id, email, full_name, company_id, role, user_type, onboarding_completed, ai_readiness_score)
SELECT
  auth.id,
  auth.email,
  seed.full_name,
  companies.id,
  seed.role_val::user_role,
  seed.type_val::user_type,
  true,
  floor(random() * 40 + 60)::int
FROM seed_users seed
JOIN auth.users auth ON auth.email = seed.email
JOIN companies ON companies.name = seed.company_name
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  user_type = EXCLUDED.user_type,
  onboarding_completed = EXCLUDED.onboarding_completed,
  ai_readiness_score = EXCLUDED.ai_readiness_score;
