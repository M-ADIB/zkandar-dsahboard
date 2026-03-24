import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, Loader2, Image as ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { ChatChannel } from '@/hooks/useChatChannels'
import toast from 'react-hot-toast'

interface ChatInputProps {
    channel: ChatChannel
    disabled?: boolean
    onOptimisticSend?: (msg: {
        id: string
        message: string
        messageType: 'text' | 'file'
        fileUrl: string | null
        fileName?: string
    }) => void
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']
const MAX_SIZE_MB = 10

function isImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) return true
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return IMAGE_EXTENSIONS.includes(ext)
}

export function ChatInput({ channel, disabled, onOptimisticSend }: ChatInputProps) {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const canSend = !disabled && user && (message.trim() || pendingFile)

    // Auto-resize textarea
    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }, [])

    useEffect(() => {
        resizeTextarea()
    }, [message, resizeTextarea])

    const uploadFile = async (file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const path = `${channel.type}/${channel.companyId || channel.cohortId}/${fileName}`

        const { error } = await supabase.storage
            .from('chat-attachments')
            .upload(path, file, { contentType: file.type })

        if (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload file')
            return null
        }

        const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(path)

        return urlData.publicUrl
    }

    const handleSend = async () => {
        if (!canSend || !user) return

        const textMessage = message.trim()

        // If there's a pending file, upload it
        if (pendingFile) {
            const optimisticId = crypto.randomUUID()
            const fileName = pendingFile.name

            // Show optimistic message immediately
            onOptimisticSend?.({
                id: optimisticId,
                message: textMessage || fileName,
                messageType: 'file',
                fileUrl: previewUrl, // use local preview for images
                fileName,
            })

            setPendingFile(null)
            setPreviewUrl(null)
            setMessage('')

            // Upload in background
            setUploading(true)
            const fileUrl = await uploadFile(pendingFile)
            setUploading(false)

            if (fileUrl) {
                await supabase
                    .from('chat_messages')
                    // @ts-expect-error - supabase insert type inference
                    .insert({
                        message: textMessage || fileName,
                        message_type: 'file',
                        file_url: fileUrl,
                        channel_type: channel.type,
                        company_id: channel.companyId || null,
                        cohort_id: channel.cohortId || null,
                        user_id: user.id,
                        is_pinned: false,
                    })
            }
            return
        }

        // Text-only message
        if (textMessage) {
            const optimisticId = crypto.randomUUID()

            // Show optimistic message immediately
            onOptimisticSend?.({
                id: optimisticId,
                message: textMessage,
                messageType: 'text',
                fileUrl: null,
            })

            setMessage('')

            await supabase
                .from('chat_messages')
                // @ts-expect-error - supabase insert type inference
                .insert({
                    message: textMessage,
                    message_type: 'text',
                    file_url: null,
                    channel_type: channel.type,
                    company_id: channel.companyId || null,
                    cohort_id: channel.cohortId || null,
                    user_id: user.id,
                    is_pinned: false,
                })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`File must be under ${MAX_SIZE_MB} MB`)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setPendingFile(file)

        // Create preview if image
        if (isImageFile(file)) {
            const reader = new FileReader()
            reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const clearPendingFile = () => {
        setPendingFile(null)
        setPreviewUrl(null)
    }

    const isImage = pendingFile && isImageFile(pendingFile)

    return (
        <div className="p-4 border-t border-border">
            {/* File Preview */}
            {pendingFile && (
                <div className="mb-3 flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    {isImage && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="h-20 w-20 bg-white/10 rounded-lg flex items-center justify-center">
                            {isImage ? (
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                            ) : (
                                <FileText className="h-8 w-8 text-lime" />
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{pendingFile.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {(pendingFile.size / 1024).toFixed(0)} KB
                            {!isImage && (
                                <span className="ml-2 text-lime/60">
                                    {pendingFile.name.split('.').pop()?.toUpperCase()}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={clearPendingFile}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-3 bg-bg-elevated rounded-xl p-2">
                {/* File Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="p-2 rounded-lg hover:bg-white/5 transition disabled:opacity-50 shrink-0"
                    title="Attach file"
                >
                    <Paperclip className="h-5 w-5 text-gray-400" />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Textarea Input */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'Chat unavailable' : 'Type a message...'}
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500 resize-none overflow-y-auto leading-relaxed py-1.5"
                    style={{ maxHeight: 160, minHeight: 24 }}
                    rows={1}
                    disabled={disabled || uploading}
                />

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={!canSend || uploading}
                    className="p-2 rounded-lg gradient-lime text-black disabled:opacity-50 transition shrink-0"
                >
                    {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    )
}
