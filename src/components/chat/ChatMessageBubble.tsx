import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Pin, FileText, Download, Loader2 } from 'lucide-react'

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
    isSending?: boolean
    currentUserName?: string
}

/** Parse @Name mentions in message text and return JSX with highlights */
function renderMessageWithMentions(text: string, isOwnBubble: boolean, currentUserName?: string) {
    // Match @Word Word patterns (1-3 words after @)
    const mentionRegex = /@([A-Za-z\u00C0-\u024F]+(?:\s[A-Za-z\u00C0-\u024F]+){0,2})/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = mentionRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index))
        }

        const mentionedName = match[1]
        const isCurrentUser = currentUserName && mentionedName.toLowerCase() === currentUserName.toLowerCase()

        parts.push(
            <span
                key={match.index}
                className={`font-semibold ${
                    isOwnBubble
                        ? isCurrentUser
                            ? 'bg-black/20 px-1 rounded text-black'
                            : 'text-black/80'
                        : isCurrentUser
                            ? 'bg-lime/20 px-1 rounded text-lime'
                            : 'text-lime'
                }`}
            >
                @{mentionedName}
            </span>
        )

        lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']

function isImageUrl(url: string): boolean {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || ''
    return IMAGE_EXTENSIONS.includes(ext)
}

function getFileNameFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname
        const segments = pathname.split('/')
        return decodeURIComponent(segments[segments.length - 1] || 'File')
    } catch {
        return 'File'
    }
}

function getFileExtension(url: string): string {
    const name = getFileNameFromUrl(url)
    return name.split('.').pop()?.toUpperCase() || 'FILE'
}

export function ChatMessageBubble({
    senderName,
    currentUserName,
    senderInitial,
    isAdmin,
    isOwn,
    message,
    messageType,
    fileUrl,
    timestamp,
    isPinned,
    isSending,
}: ChatMessageBubbleProps) {
    const [imageExpanded, setImageExpanded] = useState(false)

    const isFile = messageType === 'file' && fileUrl
    const isImage = isFile && isImageUrl(fileUrl)
    const isDocument = isFile && !isImage

    return (
        <div
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-fade-in`}
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
                <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className={`text-sm font-medium ${isOwn ? 'order-2' : ''}`}>
                        {senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                        {isSending ? (
                            <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending…
                            </span>
                        ) : (
                            timestamp
                        )}
                    </span>
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
                        {message && message !== fileUrl && message !== getFileNameFromUrl(fileUrl) && (
                            <p className="text-xs text-gray-500">{message}</p>
                        )}
                    </div>
                ) : isDocument ? (
                    /* Document / File Message */
                    <div
                        className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${isOwn
                            ? 'bg-lime/10 border-lime/20 rounded-br-md'
                            : 'bg-white/5 border-white/10 rounded-bl-md'
                            }`}
                    >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-lime/20' : 'bg-white/10'
                            }`}>
                            <FileText className={`h-5 w-5 ${isOwn ? 'text-lime' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="text-sm font-medium truncate max-w-[180px]">
                                {getFileNameFromUrl(fileUrl)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {getFileExtension(fileUrl)} Document
                            </p>
                        </div>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className={`p-2 rounded-lg transition shrink-0 ${isOwn ? 'hover:bg-lime/20 text-lime' : 'hover:bg-white/10 text-gray-400'
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                ) : messageType === 'system' ? (
                    /* System Message */
                    <div className="inline-block px-4 py-2 rounded-2xl text-xs text-gray-500 bg-white/5 italic">
                        {message}
                    </div>
                ) : (
                    /* Text Message */
                    <div
                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${isOwn
                            ? 'bg-lime text-black rounded-br-md'
                            : isAdmin
                                ? 'bg-lime/10 border border-lime/20 rounded-bl-md'
                                : 'bg-white/5 rounded-bl-md'
                            }`}
                    >
                        {renderMessageWithMentions(message, isOwn, currentUserName)}
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
        </div>
    )
}
