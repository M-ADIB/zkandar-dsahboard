import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

// =============================================
// QUERY KEY FACTORY
// =============================================
export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  room: (roomId: string) => [...chatKeys.all, 'room', roomId] as const,
  messages: (roomId: string) => [...chatKeys.all, 'messages', roomId] as const,
  unreadCounts: () => [...chatKeys.all, 'unreadCounts'] as const,
  pinnedMessages: (roomId: string) => [...chatKeys.all, 'pinnedMessages', roomId] as const,
  roomMembers: (roomId: string) => [...chatKeys.all, 'roomMembers', roomId] as const,
}

// =============================================
// ROOM HOOKS
// =============================================

export function useChatRooms() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: async () => {
      if (!user) return []

      // 0. Auto-provision workspace rooms for user's company and cohorts if they don't exist
      try {
        if (user.role === 'owner' || user.role === 'admin') {
          // Fetch all companies and cohorts to check their rooms
          const { data: companies } = await supabase.from('companies').select('id, name')
          const { data: cohorts } = await supabase.from('cohorts').select('id, name')
          
          for (const co of (companies ?? [])) {
            // Team Chat
            const { data: teamRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('company_id', co.id)
              .eq('name', 'Team Chat')
              .limit(1)
            
            if (!teamRoom || teamRoom.length === 0) {
              const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ company_id: co.id, name: 'Team Chat', type: 'workspace', created_by: user.id })
                .select().single()
              
              if (newRoom) {
                const { data: companyUsers } = await supabase.from('users').select('id').eq('company_id', co.id)
                const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                const memberIds = Array.from(new Set([...((companyUsers ?? []).map((u: any) => u.id)), ...((admins ?? []).map((u: any) => u.id))]))
                await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
              }
            }

            // Management Chat
            const { data: mgtRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('company_id', co.id)
              .eq('name', 'Management Chat')
              .limit(1)
            
            if (!mgtRoom || mgtRoom.length === 0) {
              const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ company_id: co.id, name: 'Management Chat', type: 'workspace', created_by: user.id })
                .select().single()
              
              if (newRoom) {
                const { data: mgtUsers } = await supabase.from('users').select('id').eq('company_id', co.id).eq('user_type', 'management')
                const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                const memberIds = Array.from(new Set([...((mgtUsers ?? []).map((u: any) => u.id)), ...((admins ?? []).map((u: any) => u.id))]))
                await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
              }
            }
          }

          for (const ch of (cohorts ?? [])) {
            // Sprint Chat
            const { data: sprintRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('cohort_id', ch.id)
              .eq('name', 'Sprint Chat')
              .limit(1)
            
            if (!sprintRoom || sprintRoom.length === 0) {
              const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ cohort_id: ch.id, name: 'Sprint Chat', type: 'workspace', created_by: user.id })
                .select().single()
              
              if (newRoom) {
                const { data: cohortUsers } = await supabase.from('cohort_memberships').select('user_id').eq('cohort_id', ch.id)
                const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                const memberIds = Array.from(new Set([...((cohortUsers ?? []).map((u: any) => u.user_id)), ...((admins ?? []).map((u: any) => u.id))]))
                await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
              }
            }
          }
        } else {
          // Provision for client's company
          if (user.company_id) {
            const { data: teamRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('company_id', user.company_id)
              .eq('name', 'Team Chat')
              .limit(1)
            
            if (!teamRoom || teamRoom.length === 0) {
              const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ company_id: user.company_id, name: 'Team Chat', type: 'workspace', created_by: user.id })
                .select().single()
              
              if (newRoom) {
                const { data: companyUsers } = await supabase.from('users').select('id').eq('company_id', user.company_id)
                const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                const memberIds = Array.from(new Set([...((companyUsers ?? []).map((u: any) => u.id)), ...((admins ?? []).map((u: any) => u.id))]))
                await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
              }
            }

            if (user.user_type === 'management') {
              const { data: mgtRoom } = await supabase
                .from('chat_rooms')
                .select('id')
                .eq('company_id', user.company_id)
                .eq('name', 'Management Chat')
                .limit(1)
              
              if (!mgtRoom || mgtRoom.length === 0) {
                const { data: newRoom } = await supabase
                  .from('chat_rooms')
                  .insert({ company_id: user.company_id, name: 'Management Chat', type: 'workspace', created_by: user.id })
                  .select().single()
                
                if (newRoom) {
                  const { data: mgtUsers } = await supabase.from('users').select('id').eq('company_id', user.company_id).eq('user_type', 'management')
                  const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                  const memberIds = Array.from(new Set([...((mgtUsers ?? []).map((u: any) => u.id)), ...((admins ?? []).map((u: any) => u.id))]))
                  await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
                }
              }
            }
          }

          // Provision for client's cohorts
          const { data: cohortMemberships } = await supabase
            .from('cohort_memberships')
            .select('cohort_id')
            .eq('user_id', user.id)
          
          for (const cm of (cohortMemberships ?? [])) {
            if (!cm.cohort_id) continue
            const { data: sprintRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('cohort_id', cm.cohort_id)
              .eq('name', 'Sprint Chat')
              .limit(1)
            
            if (!sprintRoom || sprintRoom.length === 0) {
              const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ cohort_id: cm.cohort_id, name: 'Sprint Chat', type: 'workspace', created_by: user.id })
                .select().single()
              
              if (newRoom) {
                const { data: cohortUsers } = await supabase.from('cohort_memberships').select('user_id').eq('cohort_id', cm.cohort_id)
                const { data: admins } = await supabase.from('users').select('id').in('role', ['owner', 'admin'])
                const memberIds = Array.from(new Set([...((cohortUsers ?? []).map((u: any) => u.user_id)), ...((admins ?? []).map((u: any) => u.id))]))
                await supabase.from('chat_room_members').insert(memberIds.map(mId => ({ room_id: newRoom.id, user_id: mId, role: mId === user.id ? 'admin' : 'member' })))
              }
            }
          }
        }
      } catch (provisionError) {
        console.error('Failed to auto-provision chat rooms:', provisionError)
      }

      // 1. Fetch room IDs where current user is a member
      const { data: memberRooms, error: memberError } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError
      const roomIds = (memberRooms ?? []).map((r: any) => r.room_id)
      if (roomIds.length === 0) return []

      // 2. Fetch full room details for those room IDs
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          members:chat_room_members(
            *,
            user:users(id, full_name, email, role)
          ),
          messages:chat_messages(
            id,
            body,
            message_type,
            created_at,
            sender_id
          )
        `)
        .in('id', roomIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { foreignTable: 'chat_messages', ascending: false })
        .limit(1, { foreignTable: 'chat_messages' })

      if (error) throw error
      return data || []
    },
    staleTime: 30000,
    enabled: !!user,
  })
}

export function useCreateChatRoom() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      name,
      userIds,
      companyId,
      cohortId,
    }: {
      type: 'dm' | 'group' | 'workspace'
      name?: string
      userIds: string[] // List of other user IDs (creator will be auto-added)
      companyId?: string
      cohortId?: string
    }) => {
      if (!user) throw new Error('Not authenticated')

      const allMemberIds = Array.from(new Set([user.id, ...userIds]))

      // 1. DM Deduplication
      if (type === 'dm' && userIds.length === 1) {
        const targetUserId = userIds[0]

        // Find all DM rooms where the current user is a member
        const { data: userDms } = await supabase
          .from('chat_room_members')
          .select('room_id, room:chat_rooms!inner(type)')
          .eq('user_id', user.id)
          .eq('room.type', 'dm')

        const dmRoomIds = (userDms ?? []).map((d: any) => d.room_id)

        if (dmRoomIds.length > 0) {
          // Check if target user is also in any of those DM rooms
          const { data: commonDms } = await supabase
            .from('chat_room_members')
            .select('room_id')
            .in('room_id', dmRoomIds)
            .eq('user_id', targetUserId)

          if (commonDms && commonDms.length > 0) {
            // DM already exists! Return the existing room ID
            return { id: commonDms[0].room_id }
          }
        }
      }

      // 2. Create New Room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type,
          name: type === 'dm' ? null : name,
          company_id: companyId || null,
          cohort_id: cohortId || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // 3. Add Members
      const membersToInsert = allMemberIds.map((mId) => ({
        room_id: room.id,
        user_id: mId,
        role: mId === user.id ? 'admin' : 'member',
      }))

      const { error: membersError } = await supabase
        .from('chat_room_members')
        .insert(membersToInsert)

      if (membersError) throw membersError

      return room
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })
    },
  })
}

export function useDeleteChatRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase.rpc('delete_chat_room', { p_room_id: roomId })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })
      toast.success('Room deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete room')
    },
  })
}

// =============================================
// MESSAGE HOOKS
// =============================================

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users(id, full_name, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    staleTime: 60000,
    enabled: !!roomId,
  })
}

export function useSendMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roomId,
      body,
      messageType = 'text',
      fileUrl,
      fileName,
      fileType,
      fileSize,
      voiceDuration,
      parentId,
      mentionedUserIds = [],
    }: {
      roomId: string
      body?: string
      messageType?: 'text' | 'file' | 'voice' | 'system'
      fileUrl?: string
      fileName?: string
      fileType?: string
      fileSize?: number
      voiceDuration?: number
      parentId?: string
      mentionedUserIds?: string[]
    }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          body: body || null,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
          file_size: fileSize || null,
          voice_duration: voiceDuration || null,
          parent_id: parentId || null,
          metadata: mentionedUserIds.length > 0 ? { mentioned_user_ids: mentionedUserIds } : {},
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) })
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })
    },
  })
}

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      roomId: _roomId,
      body,
    }: {
      messageId: string
      roomId: string
      body: string
    }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          body,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.room_id) })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
    }: {
      messageId: string
      roomId: string
    }) => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      return { roomId }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.roomId) })
    },
  })
}

export function useToggleReaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
      emoji,
    }: {
      messageId: string
      roomId: string
      emoji: string
    }) => {
      if (!user) throw new Error('Not authenticated')

      // 1. Fetch current reactions
      const { data: msg, error: fetchError } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('id', messageId)
        .single()

      if (fetchError) throw fetchError

      const reactions = { ...(msg.reactions as Record<string, string[]>) }
      const userList = reactions[emoji] ? [...reactions[emoji]] : []
      const idx = userList.indexOf(user.id)

      if (idx > -1) {
        userList.splice(idx, 1)
      } else {
        userList.push(user.id)
      }

      if (userList.length === 0) {
        delete reactions[emoji]
      } else {
        reactions[emoji] = userList
      }

      // 2. Update column
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions })
        .eq('id', messageId)

      if (updateError) throw updateError
      return { roomId }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.roomId) })
    },
  })
}

// =============================================
// READ RECEIPT HOOKS
// =============================================

export function useMarkAsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) return null

      const { data, error } = await supabase
        .from('chat_read_receipts')
        .upsert(
          {
            room_id: roomId,
            user_id: user.id,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: 'room_id,user_id' }
        )
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts() })
    },
  })
}

// =============================================
// UNREAD COUNT HOOKS
// =============================================

export function useChatRealtimeGlobalBadges() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. TanStack Query to fetch unread list from SQL RPC
  const { data: unreadCounts = [] } = useQuery({
    queryKey: chatKeys.unreadCounts(),
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.rpc('get_unread_counts', { p_user_id: user.id })
      if (error) throw error
      return (data || []) as { room_id: string; unread_count: number }[]
    },
    refetchInterval: 15000, // 15s polling backup fallback
    enabled: !!user,
  })

  // 2. Listen to postgres changes on chat_messages globally
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('chat-global-badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Invalidate and refetch counts on any new message
          void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts() })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  const totalUnread = unreadCounts.reduce((acc, curr) => acc + Number(curr.unread_count), 0)

  return { unreadCounts, totalUnread }
}

// =============================================
// PINNED MESSAGE HOOKS
// =============================================

export function usePinnedMessages(roomId: string) {
  return useQuery({
    queryKey: chatKeys.pinnedMessages(roomId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_pinned_messages')
        .select(`
          *,
          message:chat_messages(
            *,
            sender:users(id, full_name, role)
          )
        `)
        .eq('room_id', roomId)
        .order('pinned_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 60000,
    enabled: !!roomId,
  })
}

export function usePinMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chat_pinned_messages')
        .insert({
          room_id: roomId,
          message_id: messageId,
          pinned_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.pinnedMessages(data.room_id) })
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.room_id) })
      toast.success('Message pinned')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Only admins can pin messages')
    },
  })
}

export function useUnpinMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) => {
      const { error } = await supabase
        .from('chat_pinned_messages')
        .delete()
        .eq('room_id', roomId)
        .eq('message_id', messageId)

      if (error) throw error
      return { roomId }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.pinnedMessages(data.roomId) })
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.roomId) })
      toast.success('Message unpinned')
    },
  })
}

// =============================================
// FORWARD MESSAGE HOOK
// =============================================

export function useForwardMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      targetRoomId,
      sourceMessageId,
      body,
      messageType = 'text',
      fileUrl,
      fileName,
      fileType,
      fileSize,
    }: {
      targetRoomId: string
      sourceMessageId: string
      body?: string
      messageType?: 'text' | 'file' | 'voice'
      fileUrl?: string
      fileName?: string
      fileType?: string
      fileSize?: number
    }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: targetRoomId,
          sender_id: user.id,
          body: body || null,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
          file_size: fileSize || null,
          forwarded_from: sourceMessageId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.room_id) })
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })
      toast.success('Message forwarded')
    },
  })
}

// =============================================
// FILE UPLOAD HOOK
// =============================================

export function useChatUpload() {
  return useMutation({
    mutationFn: async ({
      roomId,
      file,
      companyId,
      cohortId,
    }: {
      roomId: string
      file: File
      companyId?: string
      cohortId?: string
    }) => {
      const ext = file.name.split('.').pop()
      const uuid = crypto.randomUUID()
      const folder = companyId || cohortId || 'dms'
      const path = `${folder}/${roomId}/${uuid}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path)

      return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      }
    },
  })
}

// =============================================
// BROWSER VOICE RECORDING HOOK
// =============================================

export function useChatVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })

      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(100) // Collect 100ms chunks

      setDuration(0)
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting audio recording:', err)
      toast.error('Microphone access is required to record voice notes')
    }
  }

  const stopRecording = (): Promise<{ blob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        
        // Stop stream tracks to turn off mic indicator
        recorder.stream.getTracks().forEach((track) => track.stop())

        mediaRecorderRef.current = null
        chunksRef.current = []
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)

        resolve({ blob, duration })
      }

      recorder.stop()
    })
  }

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
      chunksRef.current = []
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }

    recorder.stop()
    setDuration(0)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
