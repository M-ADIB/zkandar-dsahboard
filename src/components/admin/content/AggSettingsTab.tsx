import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Save,
    Loader2,
    CheckCircle2,
    Plus,
    Trash2,
    UserPlus,
    Mail,
    X,
    Clock,
    Globe,
    ToggleLeft,
    ToggleRight,
    Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { ContentSubscriber } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputClass =
    'w-full px-3 py-2 bg-bg-elevated border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors'
const labelClass = 'block text-xs font-medium text-gray-400 mb-1'

// ─── Common Timezones ─────────────────────────────────────────────────────────

const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
]

// ─── Add Subscriber Modal ─────────────────────────────────────────────────────

interface AddSubscriberModalProps {
    onClose: () => void
    onAdded: (sub: ContentSubscriber) => void
}

function AddSubscriberModal({ onClose, onAdded }: AddSubscriberModalProps) {
    const [email, setEmail]   = useState('')
    const [name,  setName]    = useState('')
    const [saving, setSaving] = useState(false)

    async function handleAdd() {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error('Valid email required'); return }
        setSaving(true)
        const { data, error } = await db
            .from('content_subscribers')
            .insert({ email: email.trim().toLowerCase(), name: name.trim() || null, active: true })
            .select()
            .single()
        setSaving(false)
        if (error) {
            if (error.code === '23505') { toast.error('This email is already subscribed'); return }
            toast.error(error.message)
            return
        }
        toast.success('Subscriber added')
        onAdded(data as ContentSubscriber)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-sm bg-bg-elevated border border-white/[0.08] rounded-2xl shadow-2xl"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                    <h3 className="font-semibold text-white">Add Subscriber</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className={labelClass}>Email *</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Name (optional)</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.08]">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
                    <button
                        onClick={handleAdd}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Add
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// ─── Subscriber Row ───────────────────────────────────────────────────────────

interface SubscriberRowProps {
    sub: ContentSubscriber
    onToggleActive: () => void
    onDelete: () => void
}

function SubscriberRow({ sub, onToggleActive, onDelete }: SubscriberRowProps) {
    const [confirmDelete, setConfirmDelete] = useState(false)

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-b border-white/[0.04] last:border-0"
        >
            <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-400 font-medium flex-shrink-0">
                        {(sub.name ?? sub.email)[0].toUpperCase()}
                    </div>
                    <div>
                        {sub.name && <p className="text-sm text-white font-medium">{sub.name}</p>}
                        <p className="text-xs text-gray-500">{sub.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 pr-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    sub.active
                        ? 'text-lime bg-lime/10 border-lime/20'
                        : 'text-gray-500 bg-white/5 border-white/10'
                }`}>
                    {sub.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="py-3 pr-4 text-xs text-gray-500">
                {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td className="py-3">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={onToggleActive}
                        title={sub.active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        {sub.active ? <ToggleRight className="h-4 w-4 text-lime" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    {confirmDelete ? (
                        <div className="flex items-center gap-1">
                            <button onClick={onDelete} className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">Confirm</button>
                            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-gray-500 text-xs hover:text-white transition-colors">Cancel</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </td>
        </motion.tr>
    )
}

// ─── AggSettingsTab ───────────────────────────────────────────────────────────

export function AggSettingsTab() {
    // Schedule settings
    const [digestEnabled,  setDigestEnabled]  = useState(false)
    const [digestTime,     setDigestTime]     = useState('08:00')
    const [digestTimezone, setDigestTimezone] = useState('UTC')
    const [archiveDays,    setArchiveDays]    = useState(7)
    const [loadingSettings,  setLoadingSettings]  = useState(true)
    const [savingSettings,   setSavingSettings]   = useState(false)
    const [savedSettings,    setSavedSettings]    = useState(false)

    // Subscribers
    const [subscribers,    setSubscribers]    = useState<ContentSubscriber[]>([])
    const [loadingSubs,    setLoadingSubs]    = useState(true)
    const [showAddModal,   setShowAddModal]   = useState(false)
    const [subSearch,      setSubSearch]      = useState('')

    // Digest test send
    const [sendingDigest,  setSendingDigest]  = useState(false)

    useEffect(() => {
        async function fetchSettings() {
            const keys = ['content_digest_enabled', 'content_digest_time', 'content_digest_timezone', 'content_archive_days']
            const { data } = await supabase
                .from('platform_settings')
                .select('key, value')
                .in('key', keys)
            if (data) {
                const map: Record<string, string> = {}
                data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value })
                setDigestEnabled(map['content_digest_enabled'] === 'true')
                setDigestTime(map['content_digest_time'] ?? '08:00')
                setDigestTimezone(map['content_digest_timezone'] ?? 'UTC')
                setArchiveDays(parseInt(map['content_archive_days'] ?? '7') || 7)
            }
            setLoadingSettings(false)
        }

        async function fetchSubscribers() {
            const { data, error } = await db
                .from('content_subscribers')
                .select('*')
                .order('created_at', { ascending: false })
            if (!error) setSubscribers((data ?? []) as ContentSubscriber[])
            setLoadingSubs(false)
        }

        fetchSettings()
        fetchSubscribers()
    }, [])

    async function saveSettings() {
        setSavingSettings(true)
        const rows = [
            { key: 'content_digest_enabled',  value: String(digestEnabled),  category: 'content' },
            { key: 'content_digest_time',      value: digestTime,             category: 'content' },
            { key: 'content_digest_timezone',  value: digestTimezone,         category: 'content' },
            { key: 'content_archive_days',     value: String(archiveDays),    category: 'content' },
        ]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('platform_settings').upsert(rows as any, { onConflict: 'key' })
        setSavingSettings(false)
        if (error) { toast.error(error.message); return }
        setSavedSettings(true)
        toast.success('Settings saved')
        setTimeout(() => setSavedSettings(false), 2000)
    }

    async function handleToggleSubscriber(id: string, active: boolean) {
        const { error } = await db.from('content_subscribers').update({ active }).eq('id', id)
        if (error) { toast.error('Failed to update'); return }
        setSubscribers((prev) => prev.map((s) => s.id === id ? { ...s, active } : s))
    }

    async function handleDeleteSubscriber(id: string) {
        const { error } = await db.from('content_subscribers').delete().eq('id', id)
        if (error) { toast.error('Failed to delete'); return }
        toast.success('Subscriber removed')
        setSubscribers((prev) => prev.filter((s) => s.id !== id))
    }

    async function handleSendTestDigest() {
        setSendingDigest(true)
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) { toast.error('Not authenticated'); setSendingDigest(false); return }

        const projectRef = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] ?? ''
        const url = `https://${projectRef}.supabase.co/functions/v1/send-content-digest`

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Unknown error')
            if (json.skipped) {
                toast.success(`Skipped: ${json.reason}`)
            } else {
                toast.success(`Digest sent to ${json.subscribers_sent} subscriber${json.subscribers_sent !== 1 ? 's' : ''} (${json.items_included} items)`)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to send digest')
        } finally {
            setSendingDigest(false)
        }
    }

    async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        const text = await file.text()
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
        const rows: { email: string; name: string | null }[] = []

        for (const line of lines) {
            const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim())
            const email = parts[0]
            if (!email || !/\S+@\S+\.\S+/.test(email)) continue
            rows.push({ email: email.toLowerCase(), name: parts[1] || null })
        }

        if (rows.length === 0) { toast.error('No valid emails found in CSV'); return }

        const { error } = await db
            .from('content_subscribers')
            .upsert(rows.map((r) => ({ ...r, active: true })), { onConflict: 'email', ignoreDuplicates: true })

        if (error) { toast.error(error.message); return }

        // Refresh subscribers
        const { data } = await db.from('content_subscribers').select('*').order('created_at', { ascending: false })
        setSubscribers((data ?? []) as ContentSubscriber[])
        toast.success(`Imported ${rows.length} subscriber${rows.length !== 1 ? 's' : ''}`)
    }

    const filteredSubs = subscribers.filter((s) =>
        !subSearch || s.email.includes(subSearch.toLowerCase()) || (s.name ?? '').toLowerCase().includes(subSearch.toLowerCase())
    )

    if (loadingSettings) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-lime" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8 max-w-4xl">
            {/* ── Schedule & Preferences ─────────────────────────────── */}
            <section>
                <h2 className="text-base font-semibold text-white mb-4">Schedule & Preferences</h2>
                <div className="p-5 bg-bg-elevated border border-white/[0.08] rounded-2xl space-y-5">
                    {/* Digest toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">Email Digest</p>
                            <p className="text-xs text-gray-500 mt-0.5">Send a daily brief to subscribers when new content is aggregated</p>
                        </div>
                        <button
                            onClick={() => setDigestEnabled((v) => !v)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${digestEnabled ? 'bg-lime' : 'bg-white/10'}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${digestEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Daily time */}
                        <div>
                            <label className={labelClass}>
                                <Clock className="inline h-3 w-3 mr-1" />Daily Send Time
                            </label>
                            <input
                                type="time"
                                value={digestTime}
                                onChange={(e) => setDigestTime(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className={labelClass}>
                                <Globe className="inline h-3 w-3 mr-1" />Timezone
                            </label>
                            <select
                                value={digestTimezone}
                                onChange={(e) => setDigestTimezone(e.target.value)}
                                className={inputClass + ' appearance-none'}
                            >
                                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Archive days */}
                    <div>
                        <label className={labelClass}>Auto-archive Unpinned Content After (days)</label>
                        <input
                            type="number"
                            min={1}
                            max={90}
                            value={archiveDays}
                            onChange={(e) => setArchiveDays(parseInt(e.target.value) || 7)}
                            className={inputClass + ' max-w-[120px]'}
                        />
                        <p className="mt-1 text-xs text-gray-600">Pinned items are never auto-archived.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={saveSettings}
                            disabled={savingSettings}
                            className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {savingSettings ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : savedSettings ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {savedSettings ? 'Saved' : 'Save Settings'}
                        </button>

                        <button
                            onClick={handleSendTestDigest}
                            disabled={sendingDigest}
                            className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] text-gray-300 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {sendingDigest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Send Digest Now
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Subscribers ────────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Subscribers</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {subscribers.filter((s) => s.active).length} active · {subscribers.length} total
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* CSV import */}
                        <label className="flex items-center gap-2 px-3 py-2 border border-white/[0.08] text-gray-400 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                            <Upload className="h-4 w-4" />
                            Import CSV
                            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />
                        </label>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Subscriber
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter subscribers…"
                        value={subSearch}
                        onChange={(e) => setSubSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/30 transition-colors"
                    />
                    {subSearch && <button onClick={() => setSubSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-gray-500 hover:text-white" /></button>}
                </div>

                {loadingSubs ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-lime" />
                    </div>
                ) : filteredSubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/[0.08] rounded-2xl text-center">
                        <Mail className="h-8 w-8 text-gray-700 mb-2" />
                        <p className="text-sm text-gray-500">{subSearch ? 'No matching subscribers' : 'No subscribers yet'}</p>
                    </div>
                ) : (
                    <div className="bg-bg-elevated border border-white/[0.08] rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Subscriber</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Added</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] px-4">
                                <AnimatePresence>
                                    {filteredSubs.map((sub) => (
                                        <SubscriberRow
                                            key={sub.id}
                                            sub={sub}
                                            onToggleActive={() => handleToggleSubscriber(sub.id, !sub.active)}
                                            onDelete={() => handleDeleteSubscriber(sub.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Add subscriber modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddSubscriberModal
                        onClose={() => setShowAddModal(false)}
                        onAdded={(sub) => {
                            setSubscribers((prev) => [sub, ...prev])
                            setShowAddModal(false)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
