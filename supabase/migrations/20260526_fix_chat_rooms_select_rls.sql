DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.chat_rooms;

CREATE POLICY "Users can view rooms they are members of"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_room_member(id, auth.uid()) OR created_by = auth.uid());
