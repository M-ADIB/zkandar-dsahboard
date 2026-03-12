-- Re-apply vimeo_url in case migration 036 was never run
ALTER TABLE toolbox_items
  ADD COLUMN IF NOT EXISTS vimeo_url TEXT DEFAULT NULL;

-- Subscription type for the tool
ALTER TABLE toolbox_items
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'paid'
  CHECK (subscription_type IN ('free', 'freemium', 'paid', 'enterprise'));
