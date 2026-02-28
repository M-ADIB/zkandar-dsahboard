import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Pin } from 'lucide-react'

interface ChatMessageBubbleProps {
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
}

export function ChatMessageBubble({
    senderName,
    senderInitial,
    isAdmin,
    isOwn,
    message,
    messageType,
    fileUrl,
    timestamp,
    isPinned,
}: ChatMessageBubbleProps) {
    const [imageExpanded, setImageExpanded] = useState(false)

    const isImage = messageType === 'file' && fileUrl

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
            {/* Avatar */}
            <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isAdmin
                    ? 'gradient-lime'
                    : isOwn
                        ? 'bg-lime/10'
                        : 'bg-white/10'
                    }`}
            >
                <span
                    className={`text-sm font-bold ${isAdmin ? 'text-black' : isOwn ? 'text-lime' : ''
                        }`}
                >
                    {senderInitial}
                </span>
            </div>

            {/* Message Content */}
            <div className={`max-w-md ${isOwn ? 'text-right' : ''}`}>
                {/* Sender + Timestamp */}
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isOwn ? 'order-2' : ''}`}>
                        {senderName}
                    </span>
                    <span className="text-xs text-gray-500">{timestamp}</span>
                    {isPinned && <Pin className="h-3 w-3 text-lime" />}
                </div>

                {/* Image Message */}
                {isImage ? (
                    <div className="space-y-1">
                        <div
                            className={`inline-block rounded-2xl overflow-hidden cursor-pointer border border-white/10 ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                                }`}
                            onClick={() => setImageExpanded(!imageExpanded)}
                        >
                            <img
                                src={fileUrl}
                                alt={message}
                                className={`object-cover transition-all duration-300 ${imageExpanded
                                    ? 'max-w-lg max-h-[500px]'
                                    : 'max-w-[240px] max-h-[180px]'
                                    }`}
                                loading="lazy"
                            />
                        </div>
                        {message && message !== fileUrl && (
                            <p className="text-xs text-gray-500">{message}</p>
                        )}
                    </div>
                ) : messageType === 'system' ? (
                    /* System Message */
                    <div className="inline-block px-4 py-2 rounded-2xl text-xs text-gray-500 bg-white/5 italic">
                        {message}
                    </div>
                ) : (
                    /* Text Message */
                    <div
                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${isOwn
                            ? 'bg-lime text-black rounded-br-md'
                            : isAdmin
                                ? 'bg-lime/10 border border-lime/20 rounded-bl-md'
                                : 'bg-white/5 rounded-bl-md'
                            }`}
                    >
                        {message}
                    </div>
                )}
            </div>

            {/* Expanded Image Overlay — portalled to body */}
            {imageExpanded && isImage && createPortal(
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center cursor-pointer"
                    onClick={() => setImageExpanded(false)}
                >
                    <img
                        src={fileUrl}
                        alt={message}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
                    />
                </div>,
                document.body
            )}
        </motion.div>
    )
}
