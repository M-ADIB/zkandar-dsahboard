
-- Insert Finasi mock users

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'c202c25f-1963-41a2-b34a-9b86069fd7d7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'j.sababan@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('c202c25f-1963-41a2-b34a-9b86069fd7d7', 'j.sababan@finasi.ae', 'Jerome Sababan', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'c202c25f-1963-41a2-b34a-9b86069fd7d7')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'f982e44e-a95c-4f5c-875e-0e34b156f0f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technical1@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('f982e44e-a95c-4f5c-875e-0e34b156f0f2', 'technical1@finasi.ae', 'MOHAMMED SHABIK TK', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'f982e44e-a95c-4f5c-875e-0e34b156f0f2')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'fabc46a5-2908-4cb7-9213-080c3a354a82', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm.ashique@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('fabc46a5-2908-4cb7-9213-080c3a354a82', 'm.ashique@finasi.ae', 'Muhammed Ashique', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'fabc46a5-2908-4cb7-9213-080c3a354a82')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'c3d9bee2-e2e6-4265-b2a2-1f11578b4f16', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'k.obenieta@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('c3d9bee2-e2e6-4265-b2a2-1f11578b4f16', 'k.obenieta@finasi.ae', 'Kimberly Mae Obenieta', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'c3d9bee2-e2e6-4265-b2a2-1f11578b4f16')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '0604a351-4bf1-456d-a6e9-4067ae5e3462', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'estimation@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('0604a351-4bf1-456d-a6e9-4067ae5e3462', 'estimation@finasi.ae', 'Yeye Alvarez', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '0604a351-4bf1-456d-a6e9-4067ae5e3462')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '89915b94-2448-445f-b20d-6826bad393e4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'n.aoun@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('89915b94-2448-445f-b20d-6826bad393e4', 'n.aoun@finasi.ae', 'Nancy Aoun', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '89915b94-2448-445f-b20d-6826bad393e4')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'c10e944b-a375-4629-8f1e-db0e50f479fd', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a.fondrieschi@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('c10e944b-a375-4629-8f1e-db0e50f479fd', 'a.fondrieschi@finasi.ae', 'Anna Fondrieschi', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'c10e944b-a375-4629-8f1e-db0e50f479fd')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '3ead3e2e-939c-443e-9f96-ed7efc13b0cf', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'melaniemaemarzon16@gmail.com', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('3ead3e2e-939c-443e-9f96-ed7efc13b0cf', 'melaniemaemarzon16@gmail.com', 'Melanie Mae E. Marzon', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '3ead3e2e-939c-443e-9f96-ed7efc13b0cf')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '4c39679f-4781-40dd-90b4-6e07404f1ea9', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd.evangelista@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('4c39679f-4781-40dd-90b4-6e07404f1ea9', 'd.evangelista@finasi.ae', 'EAGHTON DWYER EVANGELISTA', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '4c39679f-4781-40dd-90b4-6e07404f1ea9')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '0a12d4c1-a837-4942-977d-28202b956f7e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm.marzon@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('0a12d4c1-a837-4942-977d-28202b956f7e', 'm.marzon@finasi.ae', 'Melanie Mae E. Marzon', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '0a12d4c1-a837-4942-977d-28202b956f7e')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'fdbb8396-b4c3-42eb-bb01-6174a386b922', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dwyer.evangelista@gmail.com', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('fdbb8396-b4c3-42eb-bb01-6174a386b922', 'dwyer.evangelista@gmail.com', 'EAGHTON DWYER EVANGELISTA', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'fdbb8396-b4c3-42eb-bb01-6174a386b922')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '47b55750-5b30-4af7-983b-7af571f0d0ae', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a.nagarajiah@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('47b55750-5b30-4af7-983b-7af571f0d0ae', 'a.nagarajiah@finasi.ae', 'Abhinandan Muthushetty Nagarajiah', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '47b55750-5b30-4af7-983b-7af571f0d0ae')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

