import { useState, useEffect } from 'react'
import { Lock, Users, Zap } from 'lucide-react'
import { useChatChannels, ChatChannel } from '@/hooks/useChatChannels'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ChatInput } from '@/components/chat/ChatInput'

const channelIcons = {
    team: Users,
    management: Lock,
    sprint: Zap,
}

export function ChatPage() {
    const { groups, allChannels, loading } = useChatChannels()
    const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null)

    // Auto-select first channel when channels load
    useEffect(() => {
        if (!selectedChannel && allChannels.length > 0) {
            setSelectedChannel(allChannels[0])
        }
    }, [allChannels, selectedChannel])

    const ChannelIcon = selectedChannel ? channelIcons[selectedChannel.type] : Users

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-bg-card animate-fade-in">
            {/* Sidebar */}
            <ChatSidebar
                groups={groups}
                loading={loading}
                selectedChannelId={selectedChannel?.id ?? ''}
                onSelectChannel={setSelectedChannel}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedChannel ? (
                    <>
                        {/* Channel Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${selectedChannel.type === 'management'
                                    ? 'bg-amber-500/10'
                                    : selectedChannel.type === 'sprint'
                                        ? 'bg-purple-500/10'
                                        : 'bg-lime/10'
                                }`}>
                                <ChannelIcon className={`h-4 w-4 ${selectedChannel.type === 'management'
                                        ? 'text-amber-400'
                                        : selectedChannel.type === 'sprint'
                                            ? 'text-purple-400'
                                            : 'text-lime'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {selectedChannel.parentName}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedChannel.name}
                                    {selectedChannel.type === 'management' && ' · Restricted'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <ChatMessageList channel={selectedChannel} />

                        {/* Input */}
                        <ChatInput channel={selectedChannel} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <span className="text-3xl">💬</span>
                        </div>
                        <p className="text-sm font-medium">
                            {loading ? 'Loading channels...' : 'No channels available'}
                        </p>
                        {!loading && (
                            <p className="text-xs text-gray-600 mt-1">
                                You'll see channels here when you're added to a company or cohort.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
