-- =============================================
-- ADVANCED CHAT/MESSAGING FEATURE UPGRADE
-- =============================================

-- Drop old chat_messages table (safely cascade to drop old RLS and indexes)
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- 1. Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,  -- NULL for DMs or multi-company group chats
  cohort_id     uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,    -- NULL for DMs or company-scoped chats
  name          text,                                                    -- NULL for DMs
  type          text NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group', 'workspace')),
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()                       -- bumped on every new message
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_rooms_company_id ON public.chat_rooms(company_id);
CREATE INDEX idx_chat_rooms_cohort_id ON public.chat_rooms(cohort_id);

-- 2. Create chat_room_members table
CREATE TABLE public.chat_room_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_room_members_room_id ON public.chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);

-- 3. Create chat_messages table
CREATE TABLE public.chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body            text,                                      -- NULL for file-only or voice messages
  message_type    text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'voice', 'system')),
  file_url        text,                                      -- storage URL for file/voice
  file_name       text,                                      -- original filename
  file_type       text,                                      -- MIME type
  file_size       bigint,                                    -- bytes
  voice_duration  numeric,                                   -- seconds (for voice notes)
  parent_id       uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,  -- reply-to threading
  forwarded_from  uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,  -- source message for forwards
  is_edited       boolean NOT NULL DEFAULT false,
  edited_at       timestamptz,
  reactions       jsonb DEFAULT '{}'::jsonb,                 -- { "👍": ["userId1", "userId2"] }
  metadata        jsonb DEFAULT '{}'::jsonb,                 -- { "mentioned_user_ids": ["id1", "id2"] }
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_parent_id ON public.chat_messages(parent_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(room_id, created_at);

-- 4. Create chat_read_receipts table
CREATE TABLE public.chat_read_receipts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_read_receipts_room_id ON public.chat_read_receipts(room_id);
CREATE INDEX idx_chat_read_receipts_user_id ON public.chat_read_receipts(user_id);

-- 5. Create chat_pinned_messages table
CREATE TABLE public.chat_pinned_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  pinned_by  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pinned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, message_id)
);

ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_pinned_messages_room_id ON public.chat_pinned_messages(room_id);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Room update trigger to automatically update chat_rooms.updated_at
CREATE OR REPLACE FUNCTION public.bump_chat_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET updated_at = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bump_chat_room_updated_at
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_chat_room_updated_at();

-- Security Definer Room Deletion
CREATE OR REPLACE FUNCTION public.delete_chat_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this room';
  END IF;

  -- Delete in dependency order
  DELETE FROM chat_pinned_messages WHERE room_id = p_room_id;
  DELETE FROM chat_messages WHERE room_id = p_room_id;
  DELETE FROM chat_read_receipts WHERE room_id = p_room_id;
  DELETE FROM chat_room_members WHERE room_id = p_room_id;
  DELETE FROM chat_rooms WHERE id = p_room_id;
END;
$$;

-- Security Definer Unread badge calculation
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id uuid)
RETURNS TABLE(room_id uuid, unread_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    m.room_id,
    COUNT(*)::bigint AS unread_count
  FROM chat_messages m
  JOIN chat_room_members crm ON crm.room_id = m.room_id AND crm.user_id = p_user_id
  LEFT JOIN chat_read_receipts rr ON rr.room_id = m.room_id AND rr.user_id = p_user_id
  WHERE m.sender_id != p_user_id
    AND (rr.last_read_at IS NULL OR m.created_at > rr.last_read_at)
  GROUP BY m.room_id;
$$;

-- @Mention notification trigger
CREATE OR REPLACE FUNCTION public.notify_chat_mentioned_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mention_match text[];
  mentioned_id uuid;
  sender_name text;
BEGIN
  -- Extract @[Name](uuid) patterns from message body
  -- Skip if no body or no mentions
  IF NEW.body IS NULL THEN RETURN NEW; END IF;
  
  -- Get sender name for notification
  SELECT full_name INTO sender_name
  FROM public.users WHERE id = NEW.sender_id;
  
  -- Parse @[DisplayName](user-uuid) patterns
  FOR mention_match IN
    SELECT regexp_matches(NEW.body, '@\[([^\]]+)\]\(([0-9a-f-]{36})\)', 'g')
  LOOP
    mentioned_id := mention_match[2]::uuid;
    
    -- Skip self-mentions
    IF mentioned_id = NEW.sender_id THEN CONTINUE; END IF;
    
    -- Create notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url
    ) VALUES (
      mentioned_id,
      'info',
      'You were mentioned in a chat',
      sender_name || ' mentioned you: "' || left(NEW.body, 60) || '"',
      '/chat?room=' || NEW.room_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_notify_chat_mentioned_users
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_mentioned_users();


-- =============================================
-- RLS POLICIES
-- =============================================

-- chat_rooms
CREATE POLICY "Users can view rooms they are members of"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create rooms"
  ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- chat_room_members
CREATE POLICY "Members can view room members"
  ON public.chat_room_members FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Room members can add members"
  ON public.chat_room_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room members can delete members"
  ON public.chat_room_members FOR DELETE TO authenticated
  USING (room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid() AND role = 'admin') OR user_id = auth.uid());

-- chat_messages
CREATE POLICY "Room members can view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Room members can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Senders can update their own messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can delete their own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid() AND role = 'admin'));

-- chat_read_receipts
CREATE POLICY "Users can manage their own read receipts"
  ON public.chat_read_receipts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- chat_pinned_messages
CREATE POLICY "Room members can view pinned messages"
  ON public.chat_pinned_messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Privileged users can pin messages"
  ON public.chat_pinned_messages FOR INSERT TO authenticated
  WITH CHECK (
    pinned_by = auth.uid()
    AND room_id IN (SELECT room_id FROM public.chat_room_members WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
  );

CREATE POLICY "Pin creators or admins can unpin messages"
  ON public.chat_pinned_messages FOR DELETE TO authenticated
  USING (
    pinned_by = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
  );


-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_members;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_read_receipts;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_pinned_messages;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
