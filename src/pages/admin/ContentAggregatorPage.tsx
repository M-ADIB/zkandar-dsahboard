import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Rss,
    Globe,
    Settings2,
    RefreshCw,
    Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FeedTab }         from '@/components/admin/content/FeedTab'
import { SourcesTab }      from '@/components/admin/content/SourcesTab'
import { AggSettingsTab }  from '@/components/admin/content/AggSettingsTab'
import type { ContentSource } from '@/components/admin/content/types'

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'feed' | 'sources' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'feed',     label: 'Feed',     icon: Rss      },
    { id: 'sources',  label: 'Sources',  icon: Globe    },
    { id: 'settings', label: 'Settings', icon: Settings2 },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ContentAggregatorPage() {
    const [activeTab, setActiveTab] = useState<Tab>('feed')
    const [sources, setSources]     = useState<ContentSource[]>([])
    const [syncing, setSyncing]     = useState(false)

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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ flush_archive: true }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Sync failed')
            const newItems = json.new_items ?? 0
            const errors   = json.errors   ?? 0
            if (errors > 0) {
                toast.success(`Synced — ${newItems} new items (${errors} source error${errors !== 1 ? 's' : ''})`)
            } else {
                toast.success(`Synced — ${newItems} new item${newItems !== 1 ? 's' : ''} ingested`)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Sync failed')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Page header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                    <h1 className="text-xl font-bold text-white">Content Aggregator</h1>
                    <p className="text-sm text-gray-500 mt-0.5">AI-powered content from blogs, channels & search queries</p>
                </div>

                {/* Global sync — accessible from any tab */}
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {syncing ? 'Syncing…' : 'Sync All'}
                </button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-white/[0.06]">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
                            activeTab === id
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                        {activeTab === id && (
                            <motion.div
                                layoutId="content-agg-tab-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'feed' && (
                    <FeedTab onSync={handleSync} syncing={syncing} />
                )}
                {activeTab === 'sources' && (
                    <SourcesTab sources={sources} onSourcesChange={setSources} />
                )}
                {activeTab === 'settings' && (
                    <div className="h-full overflow-y-auto">
                        <AggSettingsTab />
                    </div>
                )}
            </div>
        </div>
    )
}
