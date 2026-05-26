import { useState } from 'react'
import { Pin, ChevronDown, ChevronUp, X, FileText, Mic } from 'lucide-react'
import { usePinnedMessages, useUnpinMessage } from '@/hooks/useChat'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTimeLabel } from '@/lib/time'

interface PinnedMessagesBarProps {
  roomId: string
  onJumpToMessage?: (messageId: string) => void
}

export function PinnedMessagesBar({ roomId, onJumpToMessage }: PinnedMessagesBarProps) {
  const { data: pinned = [], isLoading } = usePinnedMessages(roomId)
  const [expanded, setExpanded] = useState(false)
  const unpinMutation = useUnpinMessage()

  if (isLoading || pinned.length === 0) return null

  const latestPin = pinned[0]
  const pinCount = pinned.length

  const handleUnpin = (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation()
    unpinMutation.mutate({ roomId, messageId })
  }

  const renderMessagePreview = (msg: any) => {
    if (msg.message_type === 'file') {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <FileText className="h-3 w-3 text-lime" /> {msg.file_name || 'File Attachment'}
        </span>
      )
    }
    if (msg.message_type === 'voice') {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Mic className="h-3 w-3 text-lime" /> Voice Note ({msg.voice_duration ? `${msg.voice_duration}s` : 'audio'})
        </span>
      )
    }
    return <span className="text-xs text-gray-300 line-clamp-1">{msg.body}</span>
  }

  return (
    <div className="bg-bg-elevated border-b border-border relative z-10">
      {/* Bar Header (Collapsed View) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Pin className="h-4 w-4 text-lime shrink-0 transform -rotate-45" />
          <span className="text-xs font-semibold uppercase tracking-wider text-lime">
            Pinned ({pinCount})
          </span>
          {!expanded && (
            <div className="flex items-center gap-1.5 min-w-0 text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                {latestPin.message?.sender?.full_name || 'Member'}:
              </span>
              {renderMessagePreview(latestPin.message)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded List View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border bg-bg-card"
          >
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto divide-y divide-border/40">
              {pinned.map((pin: any) => {
                const msg = pin.message
                if (!msg) return null

                return (
                  <div
                    key={pin.id}
                    onClick={() => {
                      onJumpToMessage?.(msg.id)
                      setExpanded(false)
                    }}
                    className="flex items-start justify-between gap-4 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition first:pt-2.5 pt-4"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                        {msg.sender?.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white">
                            {msg.sender?.full_name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {formatTimeLabel(msg.created_at)}
                          </span>
                        </div>
                        {renderMessagePreview(msg)}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleUnpin(e, msg.id)}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition shrink-0"
                      title="Unpin message"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
