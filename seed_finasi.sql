
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

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'a5b31191-d691-49c7-b437-1af4615a4418', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a.faheez@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('a5b31191-d691-49c7-b437-1af4615a4418', 'a.faheez@finasi.ae', 'Faheez Ahmed', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'a5b31191-d691-49c7-b437-1af4615a4418')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '46994975-f9eb-47d8-98c3-0203ecbe1651', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm.mohan@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('46994975-f9eb-47d8-98c3-0203ecbe1651', 'm.mohan@finasi.ae', 'Meera Mohan', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '46994975-f9eb-47d8-98c3-0203ecbe1651')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '2f8cbf2e-7269-45c2-a40e-33ce88327636', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mail2shinyv@gmail.com', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('2f8cbf2e-7269-45c2-a40e-33ce88327636', 'mail2shinyv@gmail.com', 'SHINY VIJAYAN', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '2f8cbf2e-7269-45c2-a40e-33ce88327636')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '4411693d-4f57-447a-995f-ecfee2ce2b0e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a.shanjith@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('4411693d-4f57-447a-995f-ecfee2ce2b0e', 'a.shanjith@finasi.ae', 'AISWARAYA', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '4411693d-4f57-447a-995f-ecfee2ce2b0e')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'e2b0320b-1125-4652-a666-12d995b096f6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qs@smartidea.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('e2b0320b-1125-4652-a666-12d995b096f6', 'qs@smartidea.ae', 'Mihash CP', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'e2b0320b-1125-4652-a666-12d995b096f6')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '0b77e274-f2d7-493d-8f95-e537ebeaab42', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g.garcia@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('0b77e274-f2d7-493d-8f95-e537ebeaab42', 'g.garcia@finasi.ae', 'Glacylyn Garcia', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '0b77e274-f2d7-493d-8f95-e537ebeaab42')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'b7dd2303-87bd-444d-8eba-81a3ed88e359', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'afaaee57@gmail.com', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('b7dd2303-87bd-444d-8eba-81a3ed88e359', 'afaaee57@gmail.com', 'Faheez Ahmed', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'b7dd2303-87bd-444d-8eba-81a3ed88e359')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'a6ee359f-6e99-40ea-b837-6100eba54691', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'k.saaloukeh@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('a6ee359f-6e99-40ea-b837-6100eba54691', 'k.saaloukeh@finasi.ae', 'Kenan Saaloukeh', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'a6ee359f-6e99-40ea-b837-6100eba54691')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '7348cfde-6024-4db7-a5c1-a1b23c07cd79', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sami@s-squared.studio', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('7348cfde-6024-4db7-a5c1-a1b23c07cd79', 'sami@s-squared.studio', 'sami samawi', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '7348cfde-6024-4db7-a5c1-a1b23c07cd79')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '528db8d0-5bbf-4b0a-b96d-0dae7d90194e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a.muhammad@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('528db8d0-5bbf-4b0a-b96d-0dae7d90194e', 'a.muhammad@finasi.ae', 'Mahmood Ahmad Muhammad', 'participant', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '528db8d0-5bbf-4b0a-b96d-0dae7d90194e')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '4ed30e11-2296-4eef-8025-64cee574d5c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm.shah@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('4ed30e11-2296-4eef-8025-64cee574d5c1', 'm.shah@finasi.ae', 'Malay', 'executive', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '4ed30e11-2296-4eef-8025-64cee574d5c1')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '4b3f8843-9fc1-447b-b3ba-5f6a39c1a836', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'n.hayat@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('4b3f8843-9fc1-447b-b3ba-5f6a39c1a836', 'n.hayat@finasi.ae', 'Norah Hayat', 'executive', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', '4b3f8843-9fc1-447b-b3ba-5f6a39c1a836')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    'd176a792-eb97-45f3-870a-7cedfcd12055', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'has@finasi.ae', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('d176a792-eb97-45f3-870a-7cedfcd12055', 'has@finasi.ae', 'hisham sultan', 'executive', 'b5329df4-1664-4d17-bcbc-f96a2f847a70', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8', 'd176a792-eb97-45f3-870a-7cedfcd12055')
ON CONFLICT (cohort_id, user_id) DO NOTHING;

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

