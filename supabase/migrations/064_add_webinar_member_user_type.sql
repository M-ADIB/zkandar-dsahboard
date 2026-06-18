-- Add webinar_member to the user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'webinar_member';
