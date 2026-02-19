import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Hash, Users, Pin } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { useCompany } from '@/hooks/useCompany'
import { useAccessibleCohorts } from '@/hooks/useAccessibleCohorts'
import { supabase } from '@/lib/supabase'
import { formatTimeLabel } from '@/lib/time'
import type { ChatMessage } from '@/types/database'

interface Message {
    id: string
    sender: {
        name: string
        avatar?: string
        isAdmin?: boolean
    }
    message: string
    timestamp: string
    isPinned?: boolean
    isOwn?: boolean
}

type ChannelType = 'cohort' | 'company' | 'announcements'

interface Channel {
    id: string
    name: string
    type: ChannelType
    unread: number
    cohortId?: string
    companyId?: string
}

export function ChatPage() {
    const { user, loading: authLoading } = useAuth()
    const { isPreviewing } = useViewMode()
    const { company, loading: companyLoading } = useCompany()
    const { cohorts, loading: cohortsLoading, error: cohortsError } = useAccessibleCohorts()
    const [selectedChannelId, setSelectedChannelId] = useState<string>('')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [messagesError, setMessagesError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const senderCache = useRef(new Map<string, { name: string; isAdmin: boolean }>())

    const channels = useMemo<Channel[]>(() => {
        const list: Channel[] = []
        cohorts.forEach((cohort) => {
            list.push({
                id: `cohort:${cohort.id}`,
                name: cohort.name,
                type: 'cohort',
                unread: 0,
                cohortId: cohort.id,
            })
            list.push({
                id: `announcements:${cohort.id}`,
                name: `Announcements · ${cohort.name}`,
                type: 'announcements',
                unread: 0,
                cohortId: cohort.id,
            })
        })
        if (company?.name) {
            list.push({
                id: `company:${company.id}`,
                name: company.name,
                type: 'company',
                unread: 0,
                companyId: company.id,
            })
        }
        return list
    }, [company?.id, company?.name, cohorts])

    const selectedChannel = useMemo(() => {
        return channels.find((channel) => channel.id === selectedChannelId) ?? null
    }, [channels, selectedChannelId])

    useEffect(() => {
        if (channels.length === 0) return
        if (!channels.find((channel) => channel.id === selectedChannelId)) {
            setSelectedChannelId(channels[0].id)
        }
    }, [channels, selectedChannelId])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (authLoading || companyLoading || cohortsLoading) return

        if (!user || !selectedChannel) {
            setMessages([])
            setLoadingMessages(false)
            return
        }

        let ignore = false

        const fetchMessages = async () => {
            setLoadingMessages(true)
            setMessagesError(null)

            let query = supabase
                .from('chat_messages')
                .select('id, message, is_pinned, created_at, sender_id, company_id, cohort_id, sender:users(id, full_name, role)')
                .order('created_at', { ascending: true })

            if (selectedChannel.type === 'company') {
                if (!selectedChannel.companyId) {
                    setMessages([])
                    setLoadingMessages(false)
                    return
                }
                query = query.eq('company_id', selectedChannel.companyId)
            } else if (selectedChannel.type === 'announcements') {
                if (!selectedChannel.cohortId) {
                    setMessages([])
                    setLoadingMessages(false)
                    return
                }
                query = query.eq('cohort_id', selectedChannel.cohortId).eq('is_pinned', true).is('company_id', null)
            } else {
                if (!selectedChannel.cohortId) {
                    setMessages([])
                    setLoadingMessages(false)
                    return
                }
                query = query.eq('cohort_id', selectedChannel.cohortId).is('company_id', null)
            }

            const { data, error } = await query

            if (ignore) return

            if (error) {
                setMessagesError(error.message)
                setMessages([])
            } else {
                const rows = (data as ChatMessage[]) ?? []
                rows.forEach((row) => {
                    if (row.sender) {
                        senderCache.current.set(row.sender_id, {
                            name: row.sender.full_name,
                            isAdmin: row.sender.role === 'owner' || row.sender.role === 'admin',
                        })
                    }
                })
                const mapped = rows.map((row) => {
                    const cached = senderCache.current.get(row.sender_id)
                    const senderName = row.sender_id === user.id
                        ? user.full_name
                        : cached?.name ?? 'Member'

                    return {
                        id: row.id,
                        sender: {
                            name: senderName,
                            isAdmin: cached?.isAdmin ?? (row.sender_id === user.id ? user.role === 'owner' || user.role === 'admin' : false),
                        },
                        message: row.message,
                        timestamp: formatTimeLabel(row.created_at) || '—',
                        isPinned: row.is_pinned,
                        isOwn: row.sender_id === user.id,
                    }
                })
                setMessages(mapped)
            }

            setLoadingMessages(false)
        }

        fetchMessages()

        return () => {
            ignore = true
        }
    }, [authLoading, companyLoading, cohortsLoading, user?.id, selectedChannel])

    useEffect(() => {
        if (authLoading || companyLoading || cohortsLoading) return
        if (!user || !selectedChannel) return

        if (selectedChannel.type === 'company' && !selectedChannel.companyId) return
        if (selectedChannel.type !== 'company' && !selectedChannel.cohortId) return

        const filter = selectedChannel.type === 'company'
            ? `company_id=eq.${selectedChannel.companyId}`
            : `cohort_id=eq.${selectedChannel.cohortId}`

        const channel = supabase
            .channel(`chat:${selectedChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages',
                    filter,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        const removed = payload.old as ChatMessage
                        setMessages((prev) => prev.filter((msg) => msg.id !== removed.id))
                        return
                    }

                    const row = payload.new as ChatMessage
                    if (!row) return

                    const matchesChannel = selectedChannel.type === 'company'
                        ? row.company_id === selectedChannel.companyId
                        : selectedChannel.type === 'announcements'
                            ? row.cohort_id === selectedChannel.cohortId && row.company_id === null && row.is_pinned
                            : row.cohort_id === selectedChannel.cohortId && row.company_id === null

                    if (!matchesChannel) {
                        setMessages((prev) => prev.filter((msg) => msg.id !== row.id))
                        return
                    }

                    const cached = senderCache.current.get(row.sender_id)
                    const senderName = row.sender_id === user.id
                        ? user.full_name
                        : cached?.name ?? 'Member'

                    const messageEntry: Message = {
                        id: row.id,
                        sender: {
                            name: senderName,
                            isAdmin: cached?.isAdmin ?? (row.sender_id === user.id ? user.role === 'owner' || user.role === 'admin' : false),
                        },
                        message: row.message,
                        timestamp: formatTimeLabel(row.created_at) || '—',
                        isPinned: row.is_pinned,
                        isOwn: row.sender_id === user.id,
                    }

                    setMessages((prev) => {
                        const existingIndex = prev.findIndex((msg) => msg.id === row.id)
                        if (existingIndex === -1) {
                            return [...prev, messageEntry]
                        }

                        const next = [...prev]
                        next[existingIndex] = messageEntry
                        return next
                    })
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [authLoading, companyLoading, cohortsLoading, user, selectedChannel])

    const canSend = Boolean(
        user &&
        selectedChannel &&
        !loadingMessages &&
        !isPreviewing &&
        selectedChannel.type !== 'announcements' &&
        (selectedChannel.type === 'company' ? selectedChannel.companyId : selectedChannel.cohortId)
    )

    const inputPlaceholder = isPreviewing
        ? 'Preview mode: sending disabled'
        : selectedChannel?.type === 'announcements'
            ? 'Announcements are read-only'
            : 'Type a message...'

    const handleSend = async () => {
        if (!message.trim() || !user || !canSend) return

        if (!selectedChannel) return

        const cohortId = selectedChannel.type === 'company' ? null : selectedChannel.cohortId ?? null
        const companyId = selectedChannel.type === 'company' ? selectedChannel.companyId ?? null : null

        if (!cohortId && selectedChannel.type !== 'company') {
            setMessagesError('No cohort assigned for this channel.')
            return
        }

        const { data, error } = await supabase
            .from('chat_messages')
            // @ts-expect-error - Supabase insert type inference issue
            .insert({
                message: message.trim(),
                sender_id: user.id,
                cohort_id: cohortId,
                company_id: companyId,
                attachments: [],
                is_pinned: false,
            })
            .select('id, message, is_pinned, created_at, sender_id, company_id, cohort_id, sender:users(id, full_name, role)')
            .single()

        if (error) {
            setMessagesError('Failed to send message.')
            return
        }

        if (data) {
            const row = data as ChatMessage
            if (row.sender) {
                senderCache.current.set(row.sender_id, {
                    name: row.sender.full_name,
                    isAdmin: row.sender.role === 'owner' || row.sender.role === 'admin',
                })
            }
            const newMessage: Message = {
                id: row.id,
                sender: {
                    name: row.sender?.full_name ?? user.full_name,
                    isAdmin: row.sender?.role === 'owner' || row.sender?.role === 'admin',
                },
                message: row.message,
                timestamp: formatTimeLabel(row.created_at) || '—',
                isPinned: row.is_pinned,
                isOwn: true,
            }
            setMessages((prev) => [...prev, newMessage])
            setMessage('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-bg-card animate-fade-in">
            {/* Channels Sidebar */}
            <div className="w-64 bg-bg-elevated border-r border-border hidden md:flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="font-heading font-bold">Chat</h2>
                </div>
                <div className="flex-1 p-3 space-y-1">
                    {channels.length === 0 ? (
                        <div className="p-4 text-xs text-gray-500">No channels available.</div>
                    ) : (
                        channels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => setSelectedChannelId(channel.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${selectedChannelId === channel.id
                                    ? 'bg-lime/10 text-lime'
                                    : 'hover:bg-white/5 text-gray-400'
                                    }`}
                            >
                                <Hash className="h-4 w-4" />
                                <span className="flex-1 text-sm font-medium truncate">{channel.name}</span>
                                {channel.unread > 0 && (
                                    <span className="h-5 min-w-[20px] px-1.5 bg-lime text-black text-xs font-bold rounded-full flex items-center justify-center">
                                        {channel.unread}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {/* Channel Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Hash className="h-5 w-5 text-lime" />
                        <div>
                            <h3 className="font-semibold">
                                {selectedChannel?.name ?? 'Chat'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {cohortsLoading ? 'Loading channels...' : cohortsError ? 'Channels unavailable' : '24 members online'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-white/5 transition">
                            <Pin className="h-4 w-4 text-gray-400" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/5 transition">
                            <Users className="h-4 w-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                        <div className="p-6 text-center text-gray-500">Loading messages...</div>
                    ) : messagesError ? (
                        <div className="p-6 text-center text-red-400">{messagesError}</div>
                    ) : messages.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No messages yet.</div>
                    ) : (
                        messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${msg.sender.isAdmin
                                        ? 'gradient-lime'
                                        : msg.isOwn
                                            ? 'bg-lime/10'
                                            : 'bg-white/10'
                                        }`}
                                >
                                    <span
                                        className={`text-sm font-bold ${msg.sender.isAdmin ? 'text-black' : msg.isOwn ? 'text-lime' : ''
                                            }`}
                                    >
                                        {msg.sender.name.charAt(0)}
                                    </span>
                                </div>

                                {/* Message */}
                                <div className={`max-w-md ${msg.isOwn ? 'text-right' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-medium ${msg.isOwn ? 'order-2' : ''}`}>
                                            {msg.sender.name}
                                        </span>
                                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                        {msg.isPinned && <Pin className="h-3 w-3 text-lime" />}
                                    </div>
                                    <div
                                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${msg.isOwn
                                            ? 'bg-lime text-black rounded-br-md'
                                            : msg.sender.isAdmin
                                                ? 'bg-lime/10 border border-lime/20 rounded-bl-md'
                                                : 'bg-white/5 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 bg-bg-elevated rounded-xl p-2">
                        <button className="p-2 rounded-lg hover:bg-white/5 transition">
                            <Paperclip className="h-5 w-5 text-gray-400" />
                        </button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={inputPlaceholder}
                            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500"
                            disabled={!canSend}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || !canSend}
                            className="p-2 rounded-lg gradient-lime text-black disabled:opacity-50 transition"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
