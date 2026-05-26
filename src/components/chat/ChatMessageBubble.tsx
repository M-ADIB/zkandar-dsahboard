import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  Pin, FileText, Download, Play, Pause, Reply, Forward, 
  Smile, Edit3, Trash2, MoreVertical, Check, X 
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import { 
  useToggleReaction, usePinMessage, useUnpinMessage, 
  useDeleteMessage, useEditMessage 
} from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import { formatTimeLabel } from '@/lib/time'
import toast from 'react-hot-toast'

interface ChatMessageBubbleProps {
  id: string
  room_id: string
  sender_id: string
  body: string | null
  message_type: 'text' | 'file' | 'voice' | 'system'
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size: string | number | null
  voice_duration: number | null
  parent_id: string | null
  forwarded_from: string | null
  is_edited: boolean
  edited_at: string | null
  reactions: any
  created_at: string
  sender: {
    id: string
    full_name: string
    role: string
  }
  isOwn: boolean
  isAdmin: boolean
  allMessages?: any[] // for resolving replies
  onReply?: (message: any) => void
  onForward?: (message: any) => void
  onJumpToMessage?: (messageId: string) => void
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '🙏']

export function ChatMessageBubble({
  id,
  room_id,
  body,
  message_type,
  file_url,
  file_name,
  file_type,
  file_size,
  voice_duration,
  parent_id,
  forwarded_from,
  is_edited,
  reactions = {},
  created_at,
  sender,
  isOwn,
  isAdmin,
  allMessages = [],
  onReply,
  onForward,
  onJumpToMessage,
}: ChatMessageBubbleProps) {
  const { user } = useAuth()
  const [imageExpanded, setImageExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(body || '')
  
  // Custom Audio State (Voice notes)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(voice_duration || 0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleReactionMutation = useToggleReaction()
  const pinMutation = usePinMessage()
  const unpinMutation = useUnpinMessage()
  const deleteMutation = useDeleteMessage()
  const editMutation = useEditMessage()

  const isPrivileged = user?.role === 'owner' || user?.role === 'admin'

  // Parse @[Name](uuid) mentions in message body
  const parsedBody = useMemo(() => {
    if (!body) return ''
    
    const mentionRegex = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = mentionRegex.exec(body)) !== null) {
      if (match.index > lastIndex) {
        parts.push(body.slice(lastIndex, match.index))
      }

      const displayName = match[1]
      const targetUserId = match[2]
      const isCurrentUser = user && targetUserId === user.id

      parts.push(
        <span
          key={match.index}
          className={`font-semibold px-1 py-0.5 rounded text-xs select-none ${
            isOwn
              ? isCurrentUser
                ? 'bg-black/20 text-black font-extrabold'
                : 'text-black/80'
              : isCurrentUser
                ? 'bg-lime/20 text-lime font-extrabold border border-lime/30'
                : 'text-lime'
          }`}
        >
          @{displayName}
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < body.length) {
      parts.push(body.slice(lastIndex))
    }

    return parts.length > 0 ? parts : body
  }, [body, isOwn, user])

  // Resolve reply parent message
  const parentMessage = useMemo(() => {
    if (!parent_id) return null
    return allMessages.find((m) => m.id === parent_id)
  }, [parent_id, allMessages])

  // Resolve forwarded message sender name
  const isForwarded = !!forwarded_from

  // Audio Playback Handlers
  const togglePlay = () => {
    if (!audioRef.current && file_url) {
      audioRef.current = new Audio(file_url)
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioDuration(audioRef.current?.duration || voice_duration || 0)
      })
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
    }

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleEditSubmit = async () => {
    if (!editBody.trim()) return
    try {
      await editMutation.mutateAsync({
        messageId: id,
        roomId: room_id,
        body: editBody,
      })
      setIsEditing(false)
      toast.success('Message updated')
    } catch (err: any) {
      toast.error('Failed to edit message')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return
    try {
      await deleteMutation.mutateAsync({ messageId: id, roomId: room_id })
      toast.success('Message deleted')
    } catch (err) {
      toast.error('Failed to delete message')
    }
  }

  const handleTogglePin = async (isAlreadyPinned: boolean) => {
    try {
      if (isAlreadyPinned) {
        await unpinMutation.mutateAsync({ roomId: room_id, messageId: id })
      } else {
        await pinMutation.mutateAsync({ roomId: room_id, messageId: id })
      }
    } catch (err) {
      // Handled in hooks
    }
  }

  const formatAudioTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const isImage = message_type === 'file' && file_url && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file_url.split('.').pop()?.split('?')[0]?.toLowerCase() || '')
  
  // Format reactions array counts
  const reactionList = Object.entries(reactions || {}).map(([emoji, userIds]: [string, any]) => ({
    emoji,
    count: Array.isArray(userIds) ? userIds.length : 0,
    hasReacted: user && Array.isArray(userIds) && userIds.includes(user.id),
  })).filter(r => r.count > 0)

  return (
    <div className={`group/bubble flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} mb-4 relative`}>
      
      {/* Avatar */}
      {message_type !== 'system' && (
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-heading select-none ${
          sender.role === 'owner' || sender.role === 'admin'
            ? 'gradient-lime text-black'
            : isOwn
              ? 'bg-lime/10 text-lime border border-lime/20'
              : 'bg-white/10 text-white'
        }`}>
          {sender.full_name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Message Box */}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Name + Timestamp */}
        {message_type !== 'system' && (
          <div className="flex items-center gap-2 mb-1 text-[11px] text-gray-500">
            <span className="font-bold text-gray-300">{sender.full_name}</span>
            <span>{formatTimeLabel(created_at)}</span>
            {is_edited && <span className="text-[10px] text-gray-600">(edited)</span>}
          </div>
        )}

        {/* Reply Preview Header */}
        {parentMessage && (
          <div 
            onClick={() => onJumpToMessage?.(parentMessage.id)}
            className={`cursor-pointer text-left px-3 py-1.5 rounded-t-xl text-[11px] border-l-2 mb-0.5 border-lime/40 max-w-full truncate flex items-center gap-1.5 ${
              isOwn ? 'bg-white/5 text-gray-400' : 'bg-white/5 text-gray-400'
            }`}
          >
            <Reply className="h-3 w-3 text-lime shrink-0" />
            <span className="font-bold text-gray-300">{parentMessage.sender?.full_name}:</span>
            <span className="truncate">{parentMessage.body || '📎 Media'}</span>
          </div>
        )}

        {/* Forwarded Header */}
        {isForwarded && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 italic mb-0.5 select-none">
            <Forward className="h-3 w-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Content Wrapper */}
        <div className="relative flex items-center gap-1 group">
          
          {/* Main Bubble Content */}
          <div className="text-left">
            {isEditing ? (
              <div className="flex items-center gap-2 bg-bg-elevated border border-border p-2 rounded-2xl">
                <input
                  type="text"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-48"
                />
                <button onClick={handleEditSubmit} className="p-1 hover:bg-white/10 text-lime rounded">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/10 text-gray-400 rounded">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : isImage ? (
              /* Image Message */
              <div className="space-y-1">
                <div 
                  onClick={() => setImageExpanded(true)}
                  className={`inline-block rounded-2xl overflow-hidden border border-white/10 cursor-pointer ${
                    isOwn ? 'rounded-tr-none' : 'rounded-tl-none'
                  }`}
                >
                  <img
                    src={file_url!}
                    alt={body || 'Image'}
                    className="max-w-[240px] max-h-[180px] object-cover hover:scale-[1.02] transition duration-200"
                  />
                </div>
                {body && body !== file_url && (
                  <div className={`px-3 py-1.5 text-sm rounded-xl bg-white/5 ${isOwn ? 'text-white' : 'text-gray-300'}`}>
                    {parsedBody}
                  </div>
                )}
              </div>
            ) : message_type === 'file' && file_url ? (
              /* Document File Message */
              <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                isOwn ? 'bg-lime/10 border-lime/20 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none'
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isOwn ? 'bg-lime/20 text-lime' : 'bg-white/10 text-gray-400'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-white max-w-[150px]">
                    {file_name || 'Document'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {file_size ? `${(Number(file_size) / 1024).toFixed(0)} KB` : 'Document'}
                  </p>
                </div>
                <a
                  href={file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file_name || 'download'}
                  className={`p-2 rounded-lg transition ${
                    isOwn ? 'hover:bg-lime/20 text-lime' : 'hover:bg-white/10 text-gray-400'
                  }`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ) : message_type === 'voice' && file_url ? (
              /* Custom Voice Player */
              <div className={`inline-flex items-center gap-3 px-3 py-2.5 rounded-2xl border ${
                isOwn ? 'bg-lime/10 border-lime/20 rounded-tr-none text-lime' : 'bg-white/5 border-white/10 rounded-tl-none text-white'
              }`}>
                <button
                  onClick={togglePlay}
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition ${
                    isOwn ? 'bg-lime text-black hover:scale-105' : 'bg-lime/20 text-lime hover:bg-lime/30'
                  }`}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                </button>
                <div className="w-32 shrink-0 space-y-1">
                  {/* Progress Seek Bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-lime" 
                      style={{ width: `${(currentTime / (audioDuration || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-500">
                    <span>{formatAudioTime(currentTime)}</span>
                    <span>{formatAudioTime(audioDuration)}</span>
                  </div>
                </div>
              </div>
            ) : message_type === 'system' ? (
              /* System Message */
              <div className="mx-auto my-1 px-3 py-1.5 rounded-full text-[10px] text-gray-500 bg-white/5 select-none text-center">
                {body}
              </div>
            ) : (
              /* Regular Text Message */
              <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words border ${
                isOwn
                  ? 'bg-lime border-lime text-black rounded-tr-none font-medium'
                  : isAdmin
                    ? 'bg-lime/10 border-lime/20 rounded-tl-none text-white'
                    : 'bg-white/5 border-border rounded-tl-none text-white'
              }`}>
                {parsedBody}
              </div>
            )}
          </div>

          {/* Inline Hover Action Menu Trigger */}
          {message_type !== 'system' && (
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 ${
              isOwn ? 'mr-1 flex-row-reverse' : 'ml-1'
            }`}>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition focus:outline-none">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align={isOwn ? 'end' : 'start'}
                    className="w-40 bg-bg-card border border-border rounded-xl shadow-2xl p-1 z-[71] animate-in fade-in slide-in-from-top-2 focus:outline-none"
                  >
                    {/* Reply option */}
                    <DropdownMenu.Item
                      onSelect={() => onReply?.({ id, body, sender, message_type })}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition focus:outline-none"
                    >
                      <Reply className="h-3.5 w-3.5 text-gray-500" />
                      Reply
                    </DropdownMenu.Item>

                    {/* Forward option */}
                    <DropdownMenu.Item
                      onSelect={() => onForward?.({ id, body, messageType: message_type, fileUrl: file_url, fileName: file_name, fileType: file_type, fileSize: file_size })}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition focus:outline-none"
                    >
                      <Forward className="h-3.5 w-3.5 text-gray-500" />
                      Forward
                    </DropdownMenu.Item>

                    {/* Pin option */}
                    {isPrivileged && (
                      <DropdownMenu.Item
                        onSelect={() => handleTogglePin(false)} // Toggle handles checking duplicate
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition focus:outline-none"
                      >
                        <Pin className="h-3.5 w-3.5 text-gray-500" />
                        Pin Message
                      </DropdownMenu.Item>
                    )}

                    {/* Edit option */}
                    {isOwn && message_type === 'text' && (
                      <DropdownMenu.Item
                        onSelect={() => {
                          setEditBody(body || '')
                          setIsEditing(true)
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition focus:outline-none"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                        Edit
                      </DropdownMenu.Item>
                    )}

                    {/* Delete option */}
                    {(isOwn || isPrivileged) && (
                      <DropdownMenu.Item
                        onSelect={handleDelete}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg cursor-pointer transition focus:outline-none"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
                        Delete
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* Quick Emoji Reaction Trigger */}
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition focus:outline-none">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    side="top"
                    align="center"
                    sideOffset={5}
                    className="flex gap-1 p-1 bg-bg-card border border-border rounded-full shadow-2xl z-[71] focus:outline-none"
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          toggleReactionMutation.mutate({ messageId: id, roomId: room_id, emoji })
                        }}
                        className="p-1 text-sm hover:scale-125 transition rounded-full hover:bg-white/5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

            </div>
          )}
        </div>

        {/* Reaction Pill Overlay */}
        {reactionList.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {reactionList.map((react) => (
              <button
                key={react.emoji}
                onClick={() => {
                  toggleReactionMutation.mutate({ messageId: id, roomId: room_id, emoji: react.emoji })
                }}
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition select-none ${
                  react.hasReacted
                    ? 'bg-lime/20 border-lime/30 text-lime'
                    : 'bg-white/5 border-border hover:border-white/20 text-gray-400'
                }`}
              >
                <span>{react.emoji}</span>
                <span className="font-bold">{react.count}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Expanded Image Overlay */}
      {imageExpanded && isImage && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 z-[72] flex items-center justify-center cursor-pointer"
          onClick={() => setImageExpanded(false)}
        >
          <img
            src={file_url!}
            alt={body || 'Image'}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl animate-in fade-in"
          />
        </div>,
        document.body
      )}

    </div>
  )
}
