-- Add channel_type to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'team'
  CHECK (channel_type IN ('team', 'management', 'sprint'));

-- Create index for fast channel queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON chat_messages (company_id, channel_type, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sprint
  ON chat_messages (cohort_id, channel_type, created_at);

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Storage policy: anyone can view (public bucket)
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-attachments');

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;

-- SELECT policy
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
  OR
  (channel_type = 'team' AND company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id))
  OR
  (channel_type = 'management' AND company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id AND users.user_type = 'management'))
  OR
  (channel_type = 'sprint' AND cohort_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_memberships.user_id = auth.uid() AND cohort_memberships.cohort_id = chat_messages.cohort_id))
);

-- INSERT policy
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
    OR
    (channel_type = 'team' AND company_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id))
    OR
    (channel_type = 'management' AND company_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id AND users.user_type = 'management'))
    OR
    (channel_type = 'sprint' AND cohort_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_memberships.user_id = auth.uid() AND cohort_memberships.cohort_id = chat_messages.cohort_id))
  )
);
