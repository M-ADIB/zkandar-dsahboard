-- session_date was added to the live DB outside of migrations.
-- Ensure the column exists and backfill any rows where it is null.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_date TIMESTAMPTZ;
UPDATE sessions SET session_date = scheduled_date WHERE session_date IS NULL;
