-- AssignmentModal sends a `materials` JSONB array in every INSERT/UPDATE payload,
-- but the assignments table was created without this column (migration 001 defines it
-- on sessions but not on assignments). This causes every assignment create/edit to fail
-- with "Could not find the 'materials' column of 'assignments' in the schema cache".

ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;
