import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatTimeLabel } from '@/lib/time'
import { ChatMessageBubble } from './ChatMessageBubble'
import type { ChatChannel } from '@/hooks/useChatChannels'

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

interface ChatMessageListProps {
    channel: ChatChannel
}

export function ChatMessageList({ channel }: ChatMessageListProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<MessageDisplay[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const senderCache = useRef(new Map<string, { name: string; isAdmin: boolean }>())

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Parse channel id to get filter values
    const channelType = channel.type
    const companyId = channel.companyId || null
    const cohortId = channel.cohortId || null

    // Resolve sender info, fetching from DB on cache miss
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

        // Fetch from DB on cache miss
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
        } catch {
            // Silently fall through
        }

        return { name: 'Member', isAdmin: false }
    }, [])

    // Fetch messages
    useEffect(() => {
        if (!user) return

        let ignore = false

        const fetchMessages = async () => {
            setLoading(true)
            setError(null)

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
                setError(fetchError.message)
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

            setLoading(false)
        }

        fetchMessages()

        return () => {
            ignore = true
        }
    }, [user?.id, channelType, companyId, cohortId])

    // Real-time subscription — fixed filter includes channel_type
    useEffect(() => {
        if (!user) return

        // Build filter that includes BOTH the scope AND channel_type
        let filter: string
        if (channelType === 'sprint' && cohortId) {
            filter = `channel_type=eq.${channelType}&cohort_id=eq.${cohortId}`
        } else if (companyId) {
            filter = `channel_type=eq.${channelType}&company_id=eq.${companyId}`
        } else {
            return
        }

        const realtimeChannel = supabase
            .channel(`chat:${channel.id}`)
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

                    // Resolve sender info (fetches from DB on cache miss)
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
                        // Remove any optimistic message from the same user with same text
                        // (our own messages that were shown optimistically)
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
    }, [user?.id, user?.role, channelType, companyId, cohortId, channel.id, resolveSender])

    // Optimistic send handler — called by ChatInput
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

    return (
        <ChatMessageListView
            messages={messages}
            loading={loading}
            error={error}
            messagesEndRef={messagesEndRef}
            onOptimisticSend={handleOptimisticSend}
        />
    )
}

// Extracted view so ChatPage can pass the onOptimisticSend down
interface ChatMessageListViewProps {
    messages: MessageDisplay[]
    loading: boolean
    error: string | null
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    onOptimisticSend: (msg: {
        id: string
        message: string
        messageType: 'text' | 'file'
        fileUrl: string | null
        fileName?: string
    }) => void
}

function ChatMessageListView({ messages, loading, error, messagesEndRef }: ChatMessageListViewProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="h-5 w-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                        <span className="text-sm">Loading messages...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="p-6 text-center text-red-400 text-sm">{error}</div>
            ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs text-gray-600 mt-1">Start the conversation!</p>
                </div>
            ) : (
                messages.map(msg => (
                    <ChatMessageBubble key={msg.id} {...msg} />
                ))
            )}
            <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
        </div>
    )
}

// Re-export the list component with optimistic support accessible from parent
export { ChatMessageListView }
