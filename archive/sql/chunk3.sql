INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '4a8e561b-3c53-4a1a-ae25-87e59847eff6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd.badr@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('4a8e561b-3c53-4a1a-ae25-87e59847eff6', 'd.badr@finasi.ae', 'Daniel Badr', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '4a8e561b-3c53-4a1a-ae25-87e59847eff6')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('3fbed695-6c1a-43c4-900d-118ebec7e1de', 'test@finasi.com', 'Test Member', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '3fbed695-6c1a-43c4-900d-118ebec7e1de')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

