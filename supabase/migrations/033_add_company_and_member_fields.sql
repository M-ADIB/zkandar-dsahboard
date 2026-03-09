-- 033_add_company_and_member_fields.sql
-- Add location fields to companies and member fields to users

ALTER TABLE companies ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS nationality TEXT,
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS position TEXT;
