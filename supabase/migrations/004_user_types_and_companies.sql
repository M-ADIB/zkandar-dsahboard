-- =============================================
-- ADD USER TYPE (Management vs Team)
-- =============================================

-- Add user_type enum
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('management', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add user_type column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'team';

-- Add onboarding_data column to store full survey responses
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- =============================================
-- CREATE COMPANIES
-- =============================================

INSERT INTO companies (id, name, industry, team_size)
VALUES 
    (gen_random_uuid(), 'Finasi', 'Interior Design', 12),
    (gen_random_uuid(), 'Revie Homes', 'Architecture', 8),
    (gen_random_uuid(), 'Known Design', 'Interior Design', 15)
ON CONFLICT DO NOTHING;
