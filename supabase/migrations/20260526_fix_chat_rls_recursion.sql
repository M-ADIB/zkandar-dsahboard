-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.chat_rooms;
DROP POLICY IF EXISTS "Members can view room members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room members can delete members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Senders can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can view pinned messages" ON public.chat_pinned_messages;
DROP POLICY IF EXISTS "Privileged users can pin messages" ON public.chat_pinned_messages;

-- Create helper functions to check membership and roles without RLS recursion
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_admin(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

-- Create new policies using the helper functions
CREATE POLICY "Users can view rooms they are members of"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_room_member(id, auth.uid()));

CREATE POLICY "Members can view room members"
  ON public.chat_room_members FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Room members can delete members"
  ON public.chat_room_members FOR DELETE TO authenticated
  USING (public.is_room_admin(room_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Room members can view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Room members can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_room_member(room_id, auth.uid())
  );

CREATE POLICY "Senders can delete their own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.is_room_admin(room_id, auth.uid()));

CREATE POLICY "Room members can view pinned messages"
  ON public.chat_pinned_messages FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Privileged users can pin messages"
  ON public.chat_pinned_messages FOR INSERT TO authenticated
  WITH CHECK (
    pinned_by = auth.uid()
    AND public.is_room_member(room_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
  );
