import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Paperclip, X, Loader2, Image as ImageIcon, FileText, AtSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { ChatChannel } from '@/hooks/useChatChannels'
import type { ChatMember } from '@/hooks/useChatMembers'
import toast from 'react-hot-toast'

interface ChatInputProps {
    channel: ChatChannel
    disabled?: boolean
    members: ChatMember[]
    onOptimisticSend?: (msg: {
        id: string
        message: string
        messageType: 'text' | 'file'
        fileUrl: string | null
        fileName?: string
        mentionedUserIds?: string[]
    }) => void
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']
const MAX_SIZE_MB = 10

function isImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) return true
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return IMAGE_EXTENSIONS.includes(ext)
}

export function ChatInput({ channel, disabled, members, onOptimisticSend }: ChatInputProps) {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionIndex, setMentionIndex] = useState(0)
    const [mentionStartPos, setMentionStartPos] = useState(0)
    const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(new Map()) // name → id
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const canSend = !disabled && user && (message.trim() || pendingFile)

    // Filter members based on mention query
    const filteredMembers = useMemo(() => {
        if (mentionQuery === null) return []
        if (mentionQuery === '') return members.slice(0, 8)
        const q = mentionQuery.toLowerCase()
        return members.filter(m => m.full_name.toLowerCase().includes(q)).slice(0, 8)
    }, [mentionQuery, members])

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

    // Reset mention index when filtered results change
    useEffect(() => {
        setMentionIndex(0)
    }, [filteredMembers.length])

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

    // Insert a mention into the message
    const insertMention = (member: ChatMember) => {
        const ta = textareaRef.current
        if (!ta) return

        const before = message.slice(0, mentionStartPos)
        const after = message.slice(ta.selectionStart)
        const mentionText = `@${member.full_name} `
        const newMessage = before + mentionText + after

        setMessage(newMessage)
        setMentionedUsers(prev => new Map(prev).set(member.full_name, member.id))
        setMentionQuery(null)

        // Restore cursor position
        requestAnimationFrame(() => {
            const pos = mentionStartPos + mentionText.length
            ta.setSelectionRange(pos, pos)
            ta.focus()
        })
    }

    const handleSend = async () => {
        if (!canSend || !user) return

        const textMessage = message.trim()

        // Collect mentioned user IDs from tracked names that appear in the final message
        const mentionedUserIds: string[] = []
        mentionedUsers.forEach((userId, name) => {
            if (textMessage.includes(`@${name}`)) {
                mentionedUserIds.push(userId)
            }
        })

        // If there's a pending file, upload it
        if (pendingFile) {
            const optimisticId = crypto.randomUUID()
            const fileName = pendingFile.name

            onOptimisticSend?.({
                id: optimisticId,
                message: textMessage || fileName,
                messageType: 'file',
                fileUrl: previewUrl,
                fileName,
                mentionedUserIds,
            })

            setPendingFile(null)
            setPreviewUrl(null)
            setMessage('')
            setMentionedUsers(new Map())

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

            onOptimisticSend?.({
                id: optimisticId,
                message: textMessage,
                messageType: 'text',
                fileUrl: null,
                mentionedUserIds,
            })

            setMessage('')
            setMentionedUsers(new Map())

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
        // When mention dropdown is open, intercept navigation keys
        if (mentionQuery !== null && filteredMembers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(prev => (prev + 1) % filteredMembers.length)
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length)
                return
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                insertMention(filteredMembers[mentionIndex])
                return
            }
            if (e.key === 'Escape') {
                e.preventDefault()
                setMentionQuery(null)
                return
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setMessage(value)

        const cursorPos = e.target.selectionStart
        // Check if we're in a mention context
        const textBeforeCursor = value.slice(0, cursorPos)
        const atMatch = textBeforeCursor.match(/@(\w*)$/)

        if (atMatch) {
            setMentionStartPos(cursorPos - atMatch[0].length)
            setMentionQuery(atMatch[1])
        } else {
            setMentionQuery(null)
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

        if (isImageFile(file)) {
            const reader = new FileReader()
            reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const clearPendingFile = () => {
        setPendingFile(null)
        setPreviewUrl(null)
    }

    const isImage = pendingFile && isImageFile(pendingFile)

    return (
        <div className="p-4 border-t border-border relative">
            {/* File Preview */}
            {pendingFile && (
                <div className="mb-3 flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    {isImage && previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
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
                    <button onClick={clearPendingFile} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                </div>
            )}

            {/* @Mention Dropdown */}
            {mentionQuery !== null && filteredMembers.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden z-[72] animate-fade-in"
                >
                    <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                        <AtSign className="h-3.5 w-3.5 text-lime" />
                        <span className="text-xs text-gray-400">Mention someone</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredMembers.map((member, i) => {
                            const isHighlighted = i === mentionIndex
                            const roleLabel = member.role === 'owner' || member.role === 'admin'
                                ? member.role.charAt(0).toUpperCase() + member.role.slice(1)
                                : null

                            return (
                                <button
                                    key={member.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault() // prevent textarea blur
                                        insertMention(member)
                                    }}
                                    onMouseEnter={() => setMentionIndex(i)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${isHighlighted ? 'bg-lime/10' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${roleLabel ? 'gradient-lime text-black' : 'bg-white/10'
                                        }`}>
                                        {member.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{member.full_name}</p>
                                        {roleLabel && (
                                            <p className="text-xs text-lime/60">{roleLabel}</p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-3 bg-bg-elevated rounded-xl p-2">
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

                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'Chat unavailable' : 'Type a message... (@ to mention)'}
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-500 resize-none overflow-y-auto leading-relaxed py-1.5"
                    style={{ maxHeight: 160, minHeight: 24 }}
                    rows={1}
                    disabled={disabled || uploading}
                />

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
