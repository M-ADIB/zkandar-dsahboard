import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rss, Globe, Settings2, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FeedTab }        from './FeedTab'
import { SourcesTab }     from './SourcesTab'
import { AggSettingsTab } from './AggSettingsTab'
import type { ContentSource } from './types'

type SubTab = 'feed' | 'sources' | 'settings'

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: 'feed',     label: 'Feed',     icon: Rss      },
    { id: 'sources',  label: 'Sources',  icon: Globe    },
    { id: 'settings', label: 'Settings', icon: Settings2 },
]

export function NewsletterTab() {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('feed')
    const [sources, setSources]           = useState<ContentSource[]>([])
    const [syncing,  setSyncing]          = useState(false)

    async function handleSync() {
        setSyncing(true)
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) { toast.error('Not authenticated'); setSyncing(false); return }

        const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] ?? ''
        const url = `https://${projectRef}.supabase.co/functions/v1/aggregate-content`

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ flush_archive: true }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Sync failed')
            const n = json.new_items ?? 0
            const e = json.errors   ?? 0
            toast.success(e > 0
                ? `Synced — ${n} new items (${e} source error${e !== 1 ? 's' : ''})`
                : `Synced — ${n} new item${n !== 1 ? 's' : ''} ingested`
            )
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Sync failed')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex flex-col" style={{ minHeight: '600px' }}>
            {/* Sub-tab bar + sync button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    {SUB_TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSubTab(id)}
                            className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                activeSubTab === id
                                    ? 'bg-lime/10 text-lime border border-lime/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {activeSubTab === id && (
                                <motion.div layoutId="newsletter-subtab" className="absolute inset-0 rounded-lg" />
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {syncing ? 'Syncing…' : 'Sync All'}
                </button>
            </div>

            {/* Sub-tab content */}
            <div className="flex-1 -mx-6 border-t border-white/[0.06]">
                {activeSubTab === 'feed' && (
                    <FeedTab onSync={handleSync} syncing={syncing} />
                )}
                {activeSubTab === 'sources' && (
                    <SourcesTab sources={sources} onSourcesChange={setSources} />
                )}
                {activeSubTab === 'settings' && (
                    <div className="overflow-y-auto px-6 pt-4">
                        <AggSettingsTab />
                    </div>
                )}
            </div>
        </div>
    )
}
