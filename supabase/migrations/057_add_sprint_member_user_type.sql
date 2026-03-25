-- Add sprint_member to the user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'sprint_member';
