import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  useChatRooms, useChatMessages, useMarkAsRead, 
  useDeleteChatRoom, chatKeys 
} from '@/hooks/useChat'

// Sub-components
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { PinnedMessagesBar } from '@/components/chat/PinnedMessagesBar'
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog'
import { ForwardMessageDialog } from '@/components/chat/ForwardMessageDialog'

export function ChatPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedRoomId = searchParams.get('room') || ''

  // Dialog & state management
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false)
  const [messageToForward, setMessageToForward] = useState<any | null>(null)
  const [replyTarget, setReplyTarget] = useState<any | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Data queries
  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms()
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedRoomId)
  
  const markAsReadMutation = useMarkAsRead()
  const deleteRoomMutation = useDeleteChatRoom()

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId)
  }, [rooms, selectedRoomId])

  // Resolve room name
  const roomName = useMemo(() => {
    if (!activeRoom) return ''
    if (activeRoom.type === 'dm') {
      const otherMember = activeRoom.members?.find((m: any) => m.user_id !== user?.id)
      return otherMember?.user?.full_name || 'Direct Message'
    }
    return activeRoom.name || 'Group Chat'
  }, [activeRoom, user?.id])

  // Auto-scroll to bottom of message list
  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth')
    }
  }, [messages.length, scrollToBottom])

  // Mark room as read on open
  useEffect(() => {
    if (selectedRoomId) {
      markAsReadMutation.mutate(selectedRoomId)
      scrollToBottom('auto')
    }
  }, [selectedRoomId])

  // Postgres Real-Time Changes Listener
  useEffect(() => {
    if (!selectedRoomId) return

    const channel = supabase
      .channel(`chat-room-${selectedRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoomId}`,
        },
        async (payload) => {
          const queryKey = chatKeys.messages(selectedRoomId)

          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any

            // Fetch sender info from room members cache to avoid DB lookup
            const member = activeRoom?.members?.find((m: any) => m.user_id === newMsg.sender_id)
            const senderInfo = member?.user || { id: newMsg.sender_id, full_name: 'Member', role: 'member' }

            const msgWithSender = {
              ...newMsg,
              sender: senderInfo,
            }

            queryClient.setQueryData(queryKey, (old: any[] = []) => {
              if (old.some((m) => m.id === newMsg.id)) return old
              return [...old, msgWithSender]
            })

            // Mark room as read since user has this room open
            markAsReadMutation.mutate(selectedRoomId)
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as any
            queryClient.setQueryData(queryKey, (old: any[] = []) => {
              return old.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedMsg = payload.old as any
            queryClient.setQueryData(queryKey, (old: any[] = []) => {
              return old.filter((m) => m.id !== deletedMsg.id)
            })
          }

          // Invalidate rooms list to show updated snippet and sorted updated_at
          void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [selectedRoomId, queryClient, activeRoom])

  // Select a room
  const handleSelectRoom = (roomId: string) => {
    setSearchParams({ room: roomId })
    setReplyTarget(null)
  }

  // Deletes active room (privilege checked at function level)
  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this conversation room and all its messages?')) return
    try {
      await deleteRoomMutation.mutateAsync(selectedRoomId)
      setSearchParams({})
    } catch (err) {
      // toast error handled in hook
    }
  }

  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-lime/10', 'transition-all', 'duration-500')
      setTimeout(() => {
        el.classList.remove('bg-lime/10')
      }, 2000)
    }
  }

  // Group messages by date separators
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: any[] } = {}
    messages.forEach((msg) => {
      const dateStr = new Date(msg.created_at).toDateString()
      if (!groups[dateStr]) groups[dateStr] = []
      groups[dateStr].push(msg)
    })
    return groups
  }, [messages])

  const getDateSeparatorLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-bg-card animate-fade-in relative z-0">
      
      {/* Sidebar Panel */}
      <ChatSidebar
        rooms={rooms}
        loading={roomsLoading}
        selectedRoomId={selectedRoomId}
        onSelectRoom={handleSelectRoom}
        onOpenCreateGroup={() => setCreateGroupOpen(true)}
        className={`w-full md:w-80 md:flex flex-col shrink-0 ${
          selectedRoomId ? 'hidden md:flex' : 'flex'
        }`}
      />

      {/* Conversation Panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedRoomId ? 'flex' : 'hidden md:flex'}`}>
        {activeRoom ? (
          <>
            {/* Conversation Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg-elevated relative z-20">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button — Mobile only */}
                <button
                  onClick={() => setSearchParams({})}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-400" />
                </button>

                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  activeRoom.type === 'dm' ? 'bg-white/5 text-lime' : 'bg-lime/10 text-lime'
                }`}>
                  {activeRoom.type === 'dm' ? (
                    <span className="font-bold text-xs">{roomName.charAt(0).toUpperCase()}</span>
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                </div>
                
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-white truncate">{roomName}</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {activeRoom.type} Chat · {activeRoom.members?.length || 0} members
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {/* Delete room option for admins/owners */}
                {(user?.role === 'owner' || user?.role === 'admin') && (
                  <button
                    onClick={handleDeleteRoom}
                    disabled={deleteRoomMutation.isPending}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition"
                    title="Delete Conversation Room"
                  >
                    {deleteRoomMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Pinned Messages Collapsible Widget */}
            <PinnedMessagesBar roomId={selectedRoomId} onJumpToMessage={handleJumpToMessage} />

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-primary">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="h-5 w-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                    <span className="text-sm">Loading messages...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-sm font-semibold">No messages yet</p>
                  <p className="text-xs text-gray-600 mt-1">Send a message to start the conversation!</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateStr, dayMessages]) => (
                  <div key={dateStr} className="space-y-4">
                    {/* Date separator line */}
                    <div className="flex items-center justify-center my-4 relative">
                      <div className="absolute inset-x-0 h-px bg-border/40" />
                      <span className="bg-bg-primary px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest relative z-10">
                        {getDateSeparatorLabel(dateStr)}
                      </span>
                    </div>

                    {dayMessages.map((msg) => (
                      <div key={msg.id} id={`msg-${msg.id}`}>
                        <ChatMessageBubble
                          {...msg}
                          isOwn={msg.sender_id === user?.id}
                          isAdmin={msg.sender?.role === 'owner' || msg.sender?.role === 'admin'}
                          allMessages={messages}
                          onReply={(target) => setReplyTarget(target)}
                          onForward={(target) => {
                            setMessageToForward(target)
                            setForwardDialogOpen(true)
                          }}
                          onJumpToMessage={handleJumpToMessage}
                        />
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Input Area */}
            <ChatInput
              roomId={selectedRoomId}
              members={activeRoom.members?.map((m: any) => m.user) || []}
              companyId={activeRoom.company_id || undefined}
              cohortId={activeRoom.cohort_id || undefined}
              replyTarget={replyTarget}
              onClearReply={() => setReplyTarget(null)}
            />
          </>
        ) : (
          /* Empty Active Conversation view */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-bg-primary">
            <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4 select-none">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-sm font-semibold">
              {roomsLoading ? 'Loading channels...' : 'Select a conversation to start chatting'}
            </p>
            {!roomsLoading && (
              <p className="text-xs text-gray-600 mt-1">
                Pick a workspace, group chat, or DM from the sidebar.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSuccess={(room) => handleSelectRoom(room.id)}
      />

      <ForwardMessageDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        messageToForward={messageToForward}
      />

    </div>
  )
}
