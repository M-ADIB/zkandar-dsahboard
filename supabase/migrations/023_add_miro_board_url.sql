-- Add miro_board_url column to cohorts (optional field)
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS miro_board_url TEXT;
