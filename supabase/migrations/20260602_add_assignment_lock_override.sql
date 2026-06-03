-- Add lock_override column to assignments table
ALTER TABLE assignments ADD COLUMN lock_override text DEFAULT 'default';

-- Add check constraint to ensure only valid values
ALTER TABLE assignments ADD CONSTRAINT chk_lock_override CHECK (lock_override IN ('default', 'unlocked', 'locked'));
