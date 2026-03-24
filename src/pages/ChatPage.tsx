import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Lock, Users, Zap } from 'lucide-react'
import { useChatChannels, ChatChannel } from '@/hooks/useChatChannels'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatInput } from '@/components/chat/ChatInput'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatTimeLabel } from '@/lib/time'

/* ─────────────────────────────────────
   Responsive layout (WhatsApp-style):
   • Desktop (md+): sidebar + chat side-by-side
   • Mobile (<md): show EITHER sidebar OR chat, not both
   ───────────────────────────────────── */

const channelIcons = {
    team: Users,
    management: Lock,
    sprint: Zap,
}

interface MessageDisplay {
    id: string
    senderName: string
    senderInitial: string
    isAdmin: boolean
    isOwn: boolean
    message: string
    messageType: 'text' | 'file' | 'system'
    fileUrl: string | null
    timestamp: string
    isPinned: boolean
    isSending?: boolean
}

export function ChatPage() {
    const { groups, allChannels, loading } = useChatChannels()
    const { user } = useAuth()
    const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null)
    const [messages, setMessages] = useState<MessageDisplay[]>([])
    const [messagesLoading, setMessagesLoading] = useState(true)
    const [messagesError, setMessagesError] = useState<string | null>(null)
    const senderCache = useRef(new Map<string, { name: string; isAdmin: boolean }>())
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-select first channel when channels load (desktop only)
    useEffect(() => {
        if (!selectedChannel && allChannels.length > 0) {
            // Only auto-select on desktop
            if (window.innerWidth >= 768) {
                setSelectedChannel(allChannels[0])
            }
        }
    }, [allChannels, selectedChannel])

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Resolve sender info with DB fallback
    const resolveSender = useCallback(async (
        userId: string,
        currentUser: { id: string; full_name: string; role: string }
    ): Promise<{ name: string; isAdmin: boolean }> => {
        if (userId === currentUser.id) {
            return {
                name: currentUser.full_name,
                isAdmin: currentUser.role === 'owner' || currentUser.role === 'admin',
            }
        }
        const cached = senderCache.current.get(userId)
        if (cached) return cached

        try {
            const { data } = await supabase
                .from('users')
                .select('full_name, role')
                .eq('id', userId)
                .single()
            if (data) {
                const info = {
                    name: (data as any).full_name || 'Member',
                    isAdmin: (data as any).role === 'owner' || (data as any).role === 'admin',
                }
                senderCache.current.set(userId, info)
                return info
            }
        } catch { /* fall through */ }
        return { name: 'Member', isAdmin: false }
    }, [])

    // Fetch messages when channel changes
    useEffect(() => {
        if (!user || !selectedChannel) {
            setMessages([])
            setMessagesLoading(false)
            return
        }

        let ignore = false
        const channelType = selectedChannel.type
        const companyId = selectedChannel.companyId || null
        const cohortId = selectedChannel.cohortId || null

        const fetchMessages = async () => {
            setMessagesLoading(true)
            setMessagesError(null)

            let query = supabase
                .from('chat_messages')
                .select('id, message, message_type, file_url, is_pinned, created_at, user_id, company_id, cohort_id, channel_type, sender:users!chat_messages_user_id_fkey(id, full_name, role)')
                .eq('channel_type', channelType)
                .order('created_at', { ascending: true })

            if (channelType === 'sprint' && cohortId) {
                query = query.eq('cohort_id', cohortId)
            } else if (companyId) {
                query = query.eq('company_id', companyId)
            }

            const { data, error: fetchError } = await query

            if (ignore) return

            if (fetchError) {
                setMessagesError(fetchError.message)
                setMessages([])
            } else {
                const rows = (data ?? []) as any[]
                const mapped: MessageDisplay[] = rows.map((row) => {
                    const sender = row.sender
                    const senderId = row.user_id
                    if (sender) {
                        senderCache.current.set(senderId, {
                            name: sender.full_name,
                            isAdmin: sender.role === 'owner' || sender.role === 'admin',
                        })
                    }
                    const cached = senderCache.current.get(senderId)
                    const senderName = senderId === user.id
                        ? user.full_name
                        : cached?.name ?? 'Member'

                    return {
                        id: row.id,
                        senderName,
                        senderInitial: senderName.charAt(0).toUpperCase(),
                        isAdmin: cached?.isAdmin ?? (senderId === user.id && (user.role === 'owner' || user.role === 'admin')),
                        isOwn: senderId === user.id,
                        message: row.message,
                        messageType: row.message_type ?? 'text',
                        fileUrl: row.file_url ?? null,
                        timestamp: formatTimeLabel(row.created_at) || '—',
                        isPinned: row.is_pinned,
                    }
                })
                setMessages(mapped)
            }
            setMessagesLoading(false)
        }

        fetchMessages()
        return () => { ignore = true }
    }, [user?.id, selectedChannel?.id])

    // Real-time subscription — fixed filter includes channel_type
    useEffect(() => {
        if (!user || !selectedChannel) return

        const channelType = selectedChannel.type
        const companyId = selectedChannel.companyId || null
        const cohortId = selectedChannel.cohortId || null

        let filter: string
        if (channelType === 'sprint' && cohortId) {
            filter = `channel_type=eq.${channelType}&cohort_id=eq.${cohortId}`
        } else if (companyId) {
            filter = `channel_type=eq.${channelType}&company_id=eq.${companyId}`
        } else {
            return
        }

        const realtimeChannel = supabase
            .channel(`chat:${selectedChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages',
                    filter,
                },
                async (payload) => {
                    if (payload.eventType === 'DELETE') {
                        const removed = payload.old as any
                        setMessages(prev => prev.filter(msg => msg.id !== removed.id))
                        return
                    }

                    const row = payload.new as any
                    if (!row) return

                    const senderInfo = await resolveSender(row.user_id, {
                        id: user.id,
                        full_name: user.full_name,
                        role: user.role,
                    })

                    const entry: MessageDisplay = {
                        id: row.id,
                        senderName: senderInfo.name,
                        senderInitial: senderInfo.name.charAt(0).toUpperCase(),
                        isAdmin: senderInfo.isAdmin,
                        isOwn: row.user_id === user.id,
                        message: row.message,
                        messageType: row.message_type ?? 'text',
                        fileUrl: row.file_url ?? null,
                        timestamp: formatTimeLabel(row.created_at) || '—',
                        isPinned: row.is_pinned,
                    }

                    setMessages(prev => {
                        // Remove optimistic messages from this user with same text
                        const withoutOptimistic = entry.isOwn
                            ? prev.filter(msg => !(msg.isSending && msg.message === entry.message))
                            : prev

                        const existingIndex = withoutOptimistic.findIndex(msg => msg.id === row.id)
                        if (existingIndex === -1) {
                            return [...withoutOptimistic, entry]
                        }
                        const next = [...withoutOptimistic]
                        next[existingIndex] = entry
                        return next
                    })
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(realtimeChannel)
        }
    }, [user?.id, user?.role, selectedChannel?.id, resolveSender])

    // Optimistic send handler
    const handleOptimisticSend = useCallback((msg: {
        id: string
        message: string
        messageType: 'text' | 'file'
        fileUrl: string | null
        fileName?: string
    }) => {
        if (!user) return

        const optimistic: MessageDisplay = {
            id: msg.id,
            senderName: user.full_name,
            senderInitial: user.full_name.charAt(0).toUpperCase(),
            isAdmin: user.role === 'owner' || user.role === 'admin',
            isOwn: true,
            message: msg.message,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            timestamp: formatTimeLabel(new Date().toISOString()) || '—',
            isPinned: false,
            isSending: true,
        }

        setMessages(prev => [...prev, optimistic])
    }, [user])

    const handleSelectChannel = useCallback((channel: ChatChannel) => {
        setSelectedChannel(channel)
    }, [])

    const handleBackToList = useCallback(() => {
        setSelectedChannel(null)
    }, [])

    const ChannelIcon = selectedChannel ? channelIcons[selectedChannel.type] : Users

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-bg-card animate-fade-in">

            {/* ── Sidebar ── */}
            {/* Desktop: always visible at w-72 */}
            {/* Mobile: visible ONLY when no channel selected */}
            <ChatSidebar
                groups={groups}
                loading={loading}
                selectedChannelId={selectedChannel?.id ?? ''}
                onSelectChannel={handleSelectChannel}
                className={`
                    w-full md:w-72 md:flex flex-col shrink-0
                    ${selectedChannel ? 'hidden md:flex' : 'flex'}
                `}
            />

            {/* ── Main Chat Area ── */}
            {/* Desktop: always visible */}
            {/* Mobile: visible ONLY when a channel is selected */}
            <div className={`
                flex-1 flex flex-col min-w-0
                ${selectedChannel ? 'flex' : 'hidden md:flex'}
            `}>
                {selectedChannel ? (
                    <>
                        {/* Channel Header */}
                        <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-3">
                            {/* Back button — mobile only */}
                            <button
                                onClick={handleBackToList}
                                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-400" />
                            </button>

                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${selectedChannel.type === 'management'
                                    ? 'bg-amber-500/10'
                                    : selectedChannel.type === 'sprint'
                                        ? 'bg-purple-500/10'
                                        : 'bg-lime/10'
                                }`}>
                                <ChannelIcon className={`h-4 w-4 ${selectedChannel.type === 'management'
                                        ? 'text-amber-400'
                                        : selectedChannel.type === 'sprint'
                                            ? 'text-purple-400'
                                            : 'text-lime'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {selectedChannel.parentName}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedChannel.name}
                                    {selectedChannel.type === 'management' && ' · Restricted'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messagesLoading ? (
                                <div className="flex-1 flex items-center justify-center p-6">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <div className="h-5 w-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                                        <span className="text-sm">Loading messages...</span>
                                    </div>
                                </div>
                            ) : messagesError ? (
                                <div className="p-6 text-center text-red-400 text-sm">{messagesError}</div>
                            ) : messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
                                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                        <span className="text-2xl">💬</span>
                                    </div>
                                    <p className="text-sm font-medium">No messages yet</p>
                                    <p className="text-xs text-gray-600 mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map(msg => {
                                        const { isSending, ...bubbleProps } = msg
                                        return (
                                            <div key={msg.id} className="animate-fade-in">
                                                <ChatMessageBubbleInline {...bubbleProps} isSending={isSending} />
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <ChatInput
                            channel={selectedChannel}
                            onOptimisticSend={handleOptimisticSend}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <span className="text-3xl">💬</span>
                        </div>
                        <p className="text-sm font-medium">
                            {loading ? 'Loading channels...' : 'Select a channel to start chatting'}
                        </p>
                        {!loading && (
                            <p className="text-xs text-gray-600 mt-1">
                                Pick a channel from the sidebar to begin.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// Inline re-import of the bubble to avoid circular dependency
import { ChatMessageBubble as ChatMessageBubbleInline } from '@/components/chat/ChatMessageBubble'
