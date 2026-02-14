-- Security Hardening Bypass for Reset
ALTER TABLE public.users DISABLE TRIGGER on_user_self_update_protection;

-- Reset User
UPDATE public.users
SET 
  onboarding_completed = false,
  company_id = NULL,
  user_type = NULL,
  role = 'participant',
  onboarding_data = NULL,
  ai_readiness_score = 0
WHERE email = 'adib.baroudi2@gmail.com';

-- Restore Security
ALTER TABLE public.users ENABLE TRIGGER on_user_self_update_protection;
