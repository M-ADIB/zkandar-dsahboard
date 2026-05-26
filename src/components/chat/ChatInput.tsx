import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Paperclip, X, Loader2, FileText, AtSign, Mic, Square, Trash2 } from 'lucide-react'
import { useSendMessage, useChatUpload, useChatVoice } from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface ChatInputProps {
  roomId: string
  members: any[] // room members for @mention dropdown
  companyId?: string
  cohortId?: string
  replyTarget?: {
    id: string
    body?: string | null
    sender?: {
      full_name: string
    }
  } | null
  onClearReply?: () => void
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']
const MAX_SIZE_MB = 50

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTENSIONS.includes(ext)
}

export function ChatInput({
  roomId,
  members = [],
  companyId,
  cohortId,
  replyTarget,
  onClearReply,
}: ChatInputProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Mentions state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(new Map()) // full_name -> id
  
  // Rate limiting ref
  const lastSendTimeRef = useRef<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const sendMessageMutation = useSendMessage()
  const uploadMutation = useChatUpload()
  
  // Voice Recording Hook
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useChatVoice()

  const canSend = user && (message.trim() || pendingFile || isRecording)

  // Filter members for @mention typeahead autocomplete
  const filteredMembers = useMemo(() => {
    if (mentionQuery === null) return []
    const list = members.filter((m) => m.id !== user?.id)
    if (mentionQuery === '') return list.slice(0, 8)
    const q = mentionQuery.toLowerCase()
    return list.filter((m) => m.full_name?.toLowerCase().includes(q)).slice(0, 8)
  }, [mentionQuery, members, user?.id])

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

  useEffect(() => {
    setMentionIndex(0)
  }, [filteredMembers.length])

  // Escape key listener to clear reply preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && replyTarget) {
        onClearReply?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [replyTarget, onClearReply])

  const insertMention = (member: any) => {
    const ta = textareaRef.current
    if (!ta) return

    const before = message.slice(0, mentionStartPos)
    const after = message.slice(ta.selectionStart)
    const mentionText = `@[${member.full_name}](${member.id}) `
    const newMessage = before + mentionText + after

    setMessage(newMessage)
    setMentionedUsers((prev) => new Map(prev).set(member.full_name, member.id))
    setMentionQuery(null)

    requestAnimationFrame(() => {
      const pos = mentionStartPos + mentionText.length
      ta.setSelectionRange(pos, pos)
      ta.focus()
    })
  }

  const handleSend = async () => {
    if (!canSend || !user) return

    // 500ms client-side rate limit
    const now = Date.now()
    if (now - lastSendTimeRef.current < 500) {
      toast.error('Sending messages too fast!')
      return
    }
    lastSendTimeRef.current = now

    const textMessage = message.trim()

    // Extract mentioned UUIDs that are present in the final message
    const mentionedUserIds: string[] = []
    mentionedUsers.forEach((userId, name) => {
      if (textMessage.includes(`@[${name}](${userId})`)) {
        mentionedUserIds.push(userId)
      }
    })

    // Reset composer state early for optimists
    setMessage('')
    setMentionedUsers(new Map())
    onClearReply?.()

    // Case 1: Pending File Upload
    if (pendingFile) {
      const fileToUpload = pendingFile
      setPendingFile(null)
      setPreviewUrl(null)

      try {
        const fileData = await uploadMutation.mutateAsync({
          roomId,
          file: fileToUpload,
          companyId,
          cohortId,
        })

        await sendMessageMutation.mutateAsync({
          roomId,
          body: textMessage || undefined,
          messageType: 'file',
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileType: fileData.type,
          fileSize: fileData.size,
          parentId: replyTarget?.id,
          mentionedUserIds,
        })
      } catch (err: any) {
        toast.error('Failed to send file')
      }
      return
    }

    // Case 2: Text-only Message
    if (textMessage) {
      try {
        await sendMessageMutation.mutateAsync({
          roomId,
          body: textMessage,
          messageType: 'text',
          parentId: replyTarget?.id,
          mentionedUserIds,
        })
      } catch (err) {
        toast.error('Failed to send message')
      }
    }
  }

  // Handle Stop Recording (Uploads audio clip)
  const handleStopRecording = async () => {
    const audioData = await stopRecording()
    if (!audioData) return

    try {
      // Create File from Blob
      const audioFile = new File([audioData.blob], 'voice-note.webm', {
        type: 'audio/webm;codecs=opus',
      })

      const fileData = await uploadMutation.mutateAsync({
        roomId,
        file: audioFile,
        companyId,
        cohortId,
      })

      await sendMessageMutation.mutateAsync({
        roomId,
        messageType: 'voice',
        fileUrl: fileData.url,
        voiceDuration: audioData.duration,
        parentId: replyTarget?.id,
      })
    } catch (err) {
      toast.error('Failed to upload voice note')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Intercept dropdown navigation
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
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
      void handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    const cursorPos = e.target.selectionStart
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
    <div className="p-4 border-t border-border relative bg-bg-primary">
      
      {/* Reply Preview Banner */}
      {replyTarget && (
        <div className="mb-3 flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-border/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="text-lime">Replying to:</span>
            <span className="font-bold text-gray-200">{replyTarget.sender?.full_name}</span>
            <span className="truncate max-w-[200px] text-gray-500">"{replyTarget.body || 'Media'}"</span>
          </div>
          <button 
            onClick={onClearReply} 
            className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File Preview */}
      {pendingFile && (
        <div className="mb-3 flex items-start gap-3 p-3 bg-bg-elevated border border-border rounded-xl">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
          ) : (
            <div className="h-16 w-16 bg-white/5 border border-border rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-lime" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 truncate font-semibold">{pendingFile.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {(pendingFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button onClick={clearPendingFile} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* @Mention Autocomplete Dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-4 right-4 mb-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[72] animate-in fade-in"
        >
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <AtSign className="h-3.5 w-3.5 text-lime" />
            <span className="text-xs text-gray-400">Mention someone</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.map((member, i) => {
              const isHighlighted = i === mentionIndex
              const roleLabel = member.role === 'owner' || member.role === 'admin' ? 'Admin' : null

              return (
                <button
                  key={member.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault() // prevent textarea blur
                    insertMention(member)
                  }}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                    isHighlighted ? 'bg-lime/10 text-white' : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    roleLabel ? 'gradient-lime text-black' : 'bg-white/10 text-white'
                  }`}>
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{member.full_name}</p>
                    {roleLabel && <p className="text-[10px] text-lime/70">{roleLabel}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Voice Recorder Overlay Widget */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-bg-elevated border border-lime/30 rounded-xl p-3 glow">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-300 font-medium">Recording voice note</span>
            <span className="text-xs font-bold text-lime font-mono">
              {Math.floor(duration / 60)}:{(duration % 60) < 10 ? '0' : ''}{duration % 60}
            </span>
            {/* Visualizer effect */}
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 h-2 bg-lime animate-pulse" />
              <div className="w-0.5 h-3 bg-lime animate-pulse delay-75" />
              <div className="w-0.5 h-1.5 bg-lime animate-pulse delay-150" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="p-2 rounded-lg hover:bg-white/5 text-red-400 hover:text-red-300 transition"
              title="Discard Recording"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleStopRecording}
              className="p-2 rounded-lg bg-lime text-black hover:opacity-90 transition font-bold text-xs flex items-center gap-1.5"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Send Note
            </button>
          </div>
        </div>
      ) : (
        /* Regular Input composer row */
        <div className="flex items-end gap-3 bg-bg-elevated border border-border rounded-xl p-2 focus-within:border-lime/20 transition duration-200">
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="p-2 rounded-lg hover:bg-white/5 transition disabled:opacity-50 shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5 text-gray-500 hover:text-gray-300" />
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
            placeholder="Type a message... (@ to mention)"
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-600 resize-none overflow-y-auto leading-relaxed py-1.5 scrollbar-hide"
            style={{ maxHeight: 160, minHeight: 24 }}
            rows={1}
            disabled={uploadMutation.isPending}
          />

          {/* Voice recording button */}
          <button
            onClick={startRecording}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-lime transition shrink-0"
            title="Record Voice Note"
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend || uploadMutation.isPending || sendMessageMutation.isPending}
            className="p-2 rounded-lg gradient-lime text-black disabled:opacity-30 disabled:scale-95 transition shrink-0 transform active:scale-95"
          >
            {uploadMutation.isPending || sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
