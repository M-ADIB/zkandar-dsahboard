import { Building2, Lock, Users, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { ChatChannel, ChannelGroup } from '@/hooks/useChatChannels'

interface ChatSidebarProps {
    groups: ChannelGroup[]
    loading: boolean
    selectedChannelId: string
    onSelectChannel: (channel: ChatChannel) => void
}

const channelIcons = {
    team: Users,
    management: Lock,
    sprint: Zap,
}

export function ChatSidebar({ groups, loading, selectedChannelId, onSelectChannel }: ChatSidebarProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

    const toggleGroup = (parentId: string) => {
        setCollapsed(prev => ({ ...prev, [parentId]: !prev[parentId] }))
    }

    return (
        <div className="w-72 bg-bg-elevated border-r border-border hidden md:flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="font-heading font-bold text-lg">Chat</h2>
                <p className="text-xs text-gray-500 mt-0.5">Company channels</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {loading ? (
                    <div className="p-4 text-xs text-gray-500 animate-pulse">Loading channels...</div>
                ) : groups.length === 0 ? (
                    <div className="p-4 text-xs text-gray-500">No channels available.</div>
                ) : (
                    groups.map((group) => {
                        const isCollapsed = collapsed[group.parentId] ?? false
                        const GroupIcon = group.offeringType === 'sprint_workshop' ? Zap : Building2

                        return (
                            <div key={group.parentId} className="mb-2">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.parentId)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-white/5 transition group"
                                >
                                    <GroupIcon className="h-4 w-4 text-lime shrink-0" />
                                    <span className="flex-1 text-sm font-semibold text-gray-200 truncate">
                                        {group.parentName}
                                    </span>
                                    {isCollapsed ? (
                                        <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                                    )}
                                </button>

                                {/* Sub-channels */}
                                {!isCollapsed && (
                                    <div className="ml-3 mt-0.5 space-y-0.5">
                                        {group.channels.map((channel) => {
                                            const Icon = channelIcons[channel.type]
                                            const isSelected = selectedChannelId === channel.id

                                            return (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => onSelectChannel(channel)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${isSelected
                                                            ? 'bg-lime/10 text-lime'
                                                            : 'hover:bg-white/5 text-gray-400'
                                                        }`}
                                                >
                                                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-lime' : 'text-gray-500'
                                                        }`} />
                                                    <span className="text-sm font-medium truncate">
                                                        {channel.name}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
