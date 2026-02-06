import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Hash, Users, Pin } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

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

const channels = [
    { id: 'cohort', name: 'Cohort Jan 2026', type: 'public', unread: 3 },
    { id: 'company', name: 'Your Company', type: 'private', unread: 0 },
    { id: 'announcements', name: 'Announcements', type: 'public', unread: 1 },
]

const mockMessages: Message[] = [
    {
        id: '1',
        sender: { name: 'Admin', isAdmin: true },
        message: 'Welcome to the Zkandar AI Masterclass! Feel free to ask questions here.',
        timestamp: '10:00 AM',
        isPinned: true,
    },
    {
        id: '2',
        sender: { name: 'Sarah Chen' },
        message: 'Thanks for the great session yesterday! The prompt engineering tips were super helpful.',
        timestamp: '10:15 AM',
    },
    {
        id: '3',
        sender: { name: 'Mike Johnson' },
        message: 'Has anyone tried using the techniques for landscape renders? Would love to see examples.',
        timestamp: '10:30 AM',
    },
    {
        id: '4',
        sender: { name: 'You' },
        message: 'I experimented with it last night - the results were amazing! Will share soon.',
        timestamp: '10:45 AM',
        isOwn: true,
    },
    {
        id: '5',
        sender: { name: 'Emma Davis' },
        message: 'Looking forward to seeing your results! The possibilities are endless 🚀',
        timestamp: '11:00 AM',
    },
]

export function ChatPage() {
    const { user: _user } = useAuth()
    const [selectedChannel, setSelectedChannel] = useState('cohort')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>(mockMessages)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!message.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: { name: 'You' },
            message: message.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true,
        }

        setMessages([...messages, newMessage])
        setMessage('')
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
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${selectedChannel === channel.id
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
                    ))}
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
                                {channels.find((c) => c.id === selectedChannel)?.name}
                            </h3>
                            <p className="text-xs text-gray-500">24 members online</p>
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
                    {messages.map((msg) => (
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
                    ))}
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
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim()}
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
