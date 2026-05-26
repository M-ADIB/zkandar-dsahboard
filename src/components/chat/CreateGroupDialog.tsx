import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, Check, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCreateChatRoom } from '@/hooks/useChat'
import toast from 'react-hot-toast'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (room: any) => void
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  
  const createRoomMutation = useCreateChatRoom()

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  // Fetch users list
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['chat-users-list', user?.company_id, user?.role],
    queryFn: async () => {
      if (!user) return []
      let query = supabase.from('users').select('id, full_name, role, company_id')

      // Non-admins can only see members of their own company
      if (!isAdmin && user.company_id) {
        query = query.eq('company_id', user.company_id)
      }

      const { data, error } = await query
      if (error) throw error
      
      // Exclude current user
      return (data || []).filter((u: any) => u.id !== user.id)
    },
    enabled: open && !!user,
  })

  // Filter users based on query
  const filteredUsers = users.filter((u: any) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    try {
      const room = await createRoomMutation.mutateAsync({
        type: 'group',
        name: groupName,
        userIds: selectedUserIds,
        companyId: !isAdmin && user?.company_id ? user.company_id : undefined,
      })
      toast.success('Group chat created!')
      onOpenChange(false)
      onSuccess(room)
      
      // Reset state
      setGroupName('')
      setSelectedUserIds([])
      setSearchQuery('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[71]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-2xl p-6 z-[71] focus:outline-none animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="text-white text-lg font-bold font-heading">
                Create Group Chat
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-1">
                Name your channel and add participants
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group Name input */}
            <div>
              <label htmlFor="groupName" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Design Alignment"
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                required
              />
            </div>

            {/* Search members */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Add Members
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                />
              </div>

              {/* Members List */}
              <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-bg-elevated">
                {usersLoading ? (
                  <div className="p-4 flex items-center justify-center text-gray-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading members...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-xs">
                    No matching members found
                  </div>
                ) : (
                  filteredUsers.map((u: any) => {
                    const isSelected = selectedUserIds.includes(u.id)
                    const roleLabel = u.role === 'owner' || u.role === 'admin'
                      ? 'Admin'
                      : u.role === 'executive'
                        ? 'Executive'
                        : 'Participant'

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            u.role === 'owner' || u.role === 'admin' ? 'gradient-lime text-black' : 'bg-white/10 text-white'
                          }`}>
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.full_name}</p>
                            <p className="text-xs text-gray-500">{roleLabel}</p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-lime border-lime text-black' : 'border-border bg-transparent'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRoomMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-bold gradient-lime text-black hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {createRoomMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Group ({selectedUserIds.length})
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
