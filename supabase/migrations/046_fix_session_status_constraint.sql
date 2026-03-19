-- Normalize any rows with out-of-range status values.
-- Anything that is not 'completed' becomes 'scheduled'.
UPDATE sessions
SET status = 'scheduled'
WHERE status NOT IN ('scheduled', 'completed');

-- If the column is still an ENUM type, cast it to plain TEXT first.
DO $$ BEGIN
    ALTER TABLE sessions ALTER COLUMN status TYPE TEXT USING status::text;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Drop the existing constraint (whatever values it currently has).
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Re-create with the canonical set of values.
ALTER TABLE sessions
    ADD CONSTRAINT sessions_status_check
    CHECK (status IN ('scheduled', 'completed'));
