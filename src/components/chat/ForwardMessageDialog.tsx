import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, Send, Loader2 } from 'lucide-react'
import { useChatRooms, useForwardMessage } from '@/hooks/useChat'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface ForwardMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageToForward: {
    id: string
    body?: string
    messageType: 'text' | 'file' | 'voice'
    fileUrl?: string | null
    fileName?: string | null
    fileType?: string | null
    fileSize?: number | null
  } | null
}

export function ForwardMessageDialog({ open, onOpenChange, messageToForward }: ForwardMessageDialogProps) {
  const { user } = useAuth()
  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms()
  const [searchQuery, setSearchQuery] = useState('')
  const [forwardingRoomId, setForwardingRoomId] = useState<string | null>(null)
  
  const forwardMutation = useForwardMessage()

  if (!messageToForward) return null

  // Filter rooms based on query and name resolution
  const getRoomName = (room: any) => {
    if (room.type === 'dm') {
      const otherMember = room.members?.find((m: any) => m.user_id !== user?.id)
      return otherMember?.user?.full_name || 'Direct Message'
    }
    return room.name || 'Group Chat'
  }

  const filteredRooms = rooms.filter((room) => {
    const name = getRoomName(room)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleForward = async (roomId: string) => {
    setForwardingRoomId(roomId)
    try {
      await forwardMutation.mutateAsync({
        targetRoomId: roomId,
        sourceMessageId: messageToForward.id,
        body: messageToForward.body || undefined,
        messageType: messageToForward.messageType,
        fileUrl: messageToForward.fileUrl || undefined,
        fileName: messageToForward.fileName || undefined,
        fileType: messageToForward.fileType || undefined,
        fileSize: messageToForward.fileSize ? Number(messageToForward.fileSize) : undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to forward message')
    } finally {
      setForwardingRoomId(null)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[71]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-bg-card border border-border rounded-2xl shadow-2xl p-6 z-[71] focus:outline-none animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <Dialog.Title className="text-white text-lg font-bold font-heading">
                Forward Message
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-1">
                Select a conversation to forward this message to
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Search rooms */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
              />
            </div>

            {/* Rooms list */}
            <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-bg-elevated">
              {roomsLoading ? (
                <div className="p-4 flex items-center justify-center text-gray-500 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading conversations...
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs">
                  No active conversations found
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const roomName = getRoomName(room)
                  const isForwardingThis = forwardingRoomId === room.id
                  const initial = roomName.charAt(0).toUpperCase()

                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          room.type === 'dm' ? 'bg-white/10 text-white' : 'bg-lime/10 text-lime'
                        }`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[180px]">{roomName}</p>
                          <p className="text-xs text-gray-500 capitalize">{room.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleForward(room.id)}
                        disabled={!!forwardingRoomId}
                        className="p-2 rounded-lg bg-lime/10 hover:bg-lime text-lime hover:text-black disabled:opacity-50 transition shrink-0"
                      >
                        {isForwardingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
