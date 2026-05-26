import { useState, useMemo } from 'react'
import { Building2, Lock, Users, Zap, ChevronDown, ChevronRight, Plus, Search, Loader2 } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCreateChatRoom, useChatRealtimeGlobalBadges } from '@/hooks/useChat'
import { formatTimeLabel } from '@/lib/time'
import toast from 'react-hot-toast'

interface ChatSidebarProps {
  rooms: any[]
  loading: boolean
  selectedRoomId: string
  onSelectRoom: (roomId: string) => void
  onOpenCreateGroup: () => void
  className?: string
}

export function ChatSidebar({
  rooms,
  loading,
  selectedRoomId,
  onSelectRoom,
  onOpenCreateGroup,
  className = '',
}: ChatSidebarProps) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    workspaces: false,
    groups: false,
    dms: false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [dmSearchQuery, setDmSearchQuery] = useState('')
  const [dmOpen, setDmOpen] = useState(false)

  const createRoomMutation = useCreateChatRoom()
  const { unreadCounts } = useChatRealtimeGlobalBadges()

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'
  const isClient = user?.role === 'participant' // participants are clients

  // 1. Fetch users for DM Popover
  const { data: usersList = [], isLoading: usersLoading } = useQuery({
    queryKey: ['dm-users-list', user?.company_id, user?.role],
    queryFn: async () => {
      if (!user) return []
      let query = supabase.from('users').select('id, full_name, role, company_id')

      // Non-admins can only DM members of their own company
      if (!isAdmin && user.company_id) {
        query = query.eq('company_id', user.company_id)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []).filter((u: any) => u.id !== user.id)
    },
    enabled: dmOpen && !!user,
  })

  const filteredDmUsers = useMemo(() => {
    return usersList.filter((u: any) =>
      u.full_name.toLowerCase().includes(dmSearchQuery.toLowerCase())
    )
  }, [usersList, dmSearchQuery])

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // 2. Start a DM Room
  const handleStartDm = async (targetUserId: string) => {
    setDmOpen(false)
    setDmSearchQuery('')
    try {
      const room = await createRoomMutation.mutateAsync({
        type: 'dm',
        userIds: [targetUserId],
      })
      onSelectRoom(room.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start DM')
    }
  }

  // Helper: Resolve DM name
  const getRoomName = (room: any) => {
    if (room.type === 'dm') {
      const otherMember = room.members?.find((m: any) => m.user_id !== user?.id)
      return otherMember?.user?.full_name || 'Direct Message'
    }
    return room.name || 'Unnamed Room'
  }

  // Helper: Get room unread count
  const getUnreadCount = (roomId: string) => {
    const countObj = unreadCounts.find((c) => c.room_id === roomId)
    return countObj ? Number(countObj.unread_count) : 0
  }

  // Helper: Render last message preview snippet
  const renderLastMessageSnippet = (room: any) => {
    const lastMsg = room.messages?.[0]
    if (!lastMsg) return 'No messages yet'

    const senderName = lastMsg.sender_id === user?.id ? 'You' : ''
    const prefix = senderName ? `${senderName}: ` : ''
    
    if (lastMsg.message_type === 'file') return `${prefix}📎 Sent a file`
    if (lastMsg.message_type === 'voice') return `${prefix}🎤 Sent a voice note`
    return `${prefix}${lastMsg.body || ''}`
  }

  // Group rooms by category
  const categorizedRooms = useMemo(() => {
    const workspaces: any[] = []
    const groups: any[] = []
    const dms: any[] = []

    rooms.forEach((room) => {
      const name = getRoomName(room)
      if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return
      }

      if (room.type === 'workspace') workspaces.push(room)
      else if (room.type === 'group') groups.push(room)
      else if (room.type === 'dm') dms.push(room)
    })

    return { workspaces, groups, dms }
  }, [rooms, searchQuery, user?.id])

  return (
    <div className={`bg-bg-elevated border-r border-border flex flex-col h-full ${className}`}>
      
      {/* Search Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-white">Chat</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat rooms..."
            className="w-full bg-bg-primary border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {loading ? (
          <div className="p-4 text-xs text-gray-500 animate-pulse flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading conversations...
          </div>
        ) : rooms.length === 0 && !searchQuery ? (
          <div className="p-4 text-center text-xs text-gray-600">
            No active conversations. Start a DM or group chat to begin!
          </div>
        ) : (
          <>
            {/* Section 1: Workspaces */}
            {categorizedRooms.workspaces.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('workspaces')}
                  className="w-full flex items-center justify-between px-2 py-1 text-gray-500 hover:text-white transition"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">Workspaces</span>
                  {collapsed.workspaces ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {!collapsed.workspaces && (
                  <div className="mt-1.5 space-y-0.5">
                    {categorizedRooms.workspaces.map((room) => {
                      const isSelected = selectedRoomId === room.id
                      const unread = getUnreadCount(room.id)
                      const lastMsg = room.messages?.[0]
                      const name = getRoomName(room)
                      const isLock = name.toLowerCase().includes('management')
                      const isSprint = name.toLowerCase().includes('sprint')
                      
                      const Icon = isLock ? Lock : isSprint ? Zap : Building2

                      return (
                        <button
                          key={room.id}
                          onClick={() => onSelectRoom(room.id)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                            isSelected ? 'bg-lime/10 text-lime border border-lime/10' : 'hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-lime/20 text-lime' : 'bg-white/5 text-gray-500'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold truncate text-white">{name}</span>
                              {lastMsg && (
                                <span className="text-[10px] text-gray-600 shrink-0">
                                  {formatTimeLabel(lastMsg.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-gray-500 truncate mr-2">
                                {renderLastMessageSnippet(room)}
                              </p>
                              {unread > 0 && (
                                <span className="h-4 min-w-[16px] rounded-full bg-lime text-black font-bold text-[10px] flex items-center justify-center px-1 shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Group Chats */}
            <div>
              <div className="flex items-center justify-between px-2 py-1 text-gray-500 hover:text-white transition">
                <button
                  onClick={() => toggleSection('groups')}
                  className="flex items-center gap-1.5 text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">Groups</span>
                  {collapsed.groups ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {!isClient && (
                  <button
                    onClick={onOpenCreateGroup}
                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-lime transition"
                    title="Create Group"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {!collapsed.groups && (
                <div className="mt-1.5 space-y-0.5">
                  {categorizedRooms.groups.length === 0 ? (
                    <p className="text-[11px] text-gray-600 px-3 py-1.5 italic">No group chats</p>
                  ) : (
                    categorizedRooms.groups.map((room) => {
                      const isSelected = selectedRoomId === room.id
                      const unread = getUnreadCount(room.id)
                      const lastMsg = room.messages?.[0]
                      const name = getRoomName(room)

                      return (
                        <button
                          key={room.id}
                          onClick={() => onSelectRoom(room.id)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                            isSelected ? 'bg-lime/10 text-lime border border-lime/10' : 'hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-lime/20 text-lime' : 'bg-white/5 text-gray-500'
                          }`}>
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold truncate text-white">{name}</span>
                              {lastMsg && (
                                <span className="text-[10px] text-gray-600 shrink-0">
                                  {formatTimeLabel(lastMsg.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-gray-500 truncate mr-2">
                                {renderLastMessageSnippet(room)}
                              </p>
                              {unread > 0 && (
                                <span className="h-4 min-w-[16px] rounded-full bg-lime text-black font-bold text-[10px] flex items-center justify-center px-1 shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Direct Messages */}
            <div>
              <div className="flex items-center justify-between px-2 py-1 text-gray-500 hover:text-white transition">
                <button
                  onClick={() => toggleSection('dms')}
                  className="flex items-center gap-1.5 text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">Direct Messages</span>
                  {collapsed.dms ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {/* DM Trigger Popover */}
                <Popover.Root open={dmOpen} onOpenChange={setDmOpen}>
                  <Popover.Trigger asChild>
                    <button
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-lime transition"
                      title="New Direct Message"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-56 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[72] animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="p-2 border-b border-border">
                        <input
                          type="text"
                          value={dmSearchQuery}
                          onChange={(e) => setDmSearchQuery(e.target.value)}
                          placeholder="Search users..."
                          className="w-full bg-bg-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {usersLoading ? (
                          <div className="p-4 text-center text-xs text-gray-500">
                            Loading users...
                          </div>
                        ) : filteredDmUsers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-600">
                            No users found
                          </div>
                        ) : (
                          filteredDmUsers.map((u: any) => (
                            <button
                              key={u.id}
                              onClick={() => handleStartDm(u.id)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-white transition flex items-center gap-2"
                            >
                              <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-[10px] text-lime">
                                {u.full_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate">{u.full_name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              {!collapsed.dms && (
                <div className="mt-1.5 space-y-0.5">
                  {categorizedRooms.dms.length === 0 ? (
                    <p className="text-[11px] text-gray-600 px-3 py-1.5 italic">No direct messages</p>
                  ) : (
                    categorizedRooms.dms.map((room) => {
                      const isSelected = selectedRoomId === room.id
                      const unread = getUnreadCount(room.id)
                      const lastMsg = room.messages?.[0]
                      const name = getRoomName(room)

                      return (
                        <button
                          key={room.id}
                          onClick={() => onSelectRoom(room.id)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                            isSelected ? 'bg-lime/10 text-lime border border-lime/10' : 'hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isSelected ? 'bg-lime text-black font-extrabold' : 'bg-white/5 text-lime'
                          }`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold truncate text-white">{name}</span>
                              {lastMsg && (
                                <span className="text-[10px] text-gray-600 shrink-0">
                                  {formatTimeLabel(lastMsg.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-gray-500 truncate mr-2">
                                {renderLastMessageSnippet(room)}
                              </p>
                              {unread > 0 && (
                                <span className="h-4 min-w-[16px] rounded-full bg-lime text-black font-bold text-[10px] flex items-center justify-center px-1 shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
