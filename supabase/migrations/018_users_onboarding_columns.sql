-- =============================================
-- ENSURE USERS ONBOARDING COLUMNS EXIST
-- =============================================

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('management', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS user_type user_type;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ai_readiness_score INTEGER DEFAULT 0;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
