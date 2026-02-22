import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import type { ToolboxItem, ToolboxImportance, ToolboxToolType } from '@/types/database'

interface ToolboxItemModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    item?: ToolboxItem | null
}

const IMPORTANCE_OPTIONS: { value: ToolboxImportance; label: string }[] = [
    { value: 'essential', label: '🔴 Essential' },
    { value: 'recommended', label: '🟡 Recommended' },
    { value: 'optional', label: '⚪ Optional' },
]

const TOOL_TYPE_OPTIONS: { value: ToolboxToolType; label: string }[] = [
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'video_generation', label: 'Video Generation' },
    { value: 'text_generation', label: 'Text Generation' },
    { value: 'automation', label: 'Automation' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'other', label: 'Other' },
]

const defaultForm = {
    title: '',
    url: '',
    description: '',
    importance: 'recommended' as ToolboxImportance,
    category: '',
    tool_type: 'other' as ToolboxToolType,
    is_active: true,
}

const inputClass = 'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-lime/50 transition'
const labelClass = 'block text-sm font-medium text-gray-300 mb-1'

export function ToolboxItemModal({ isOpen, onClose, onSuccess, item }: ToolboxItemModalProps) {
    const supabase = useSupabase()
    const [form, setForm] = useState(defaultForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (item) {
            setForm({
                title: item.title,
                url: item.url,
                description: item.description ?? '',
                importance: item.importance,
                category: item.category,
                tool_type: item.tool_type,
                is_active: item.is_active,
            })
        } else {
            setForm(defaultForm)
        }
        setError(null)
    }, [item, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim() || !form.url.trim()) {
            setError('Title and URL are required.')
            return
        }
        setLoading(true)
        setError(null)

        const payload = {
            ...form,
            description: form.description.trim() || null,
            updated_at: new Date().toISOString(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tbl = supabase.from('toolbox_items') as any
        const { error: saveErr } = item
            ? await tbl.update(payload).eq('id', item.id)
            : await tbl.insert(payload)

        setLoading(false)
        if (saveErr) { setError(saveErr.message); return }
        onSuccess()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        className="relative w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-white">
                                {item ? 'Edit Tool' : 'Add Tool'}
                            </h2>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Title *</label>
                                <input type="text" required className={inputClass} placeholder="e.g. Midjourney"
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>

                            <div>
                                <label className={labelClass}>URL *</label>
                                <input type="url" required className={inputClass} placeholder="https://..."
                                    value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                            </div>

                            <div>
                                <label className={labelClass}>Description</label>
                                <textarea rows={3} className={inputClass + ' resize-none'} placeholder="What does this tool do?"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Category</label>
                                    <input type="text" className={inputClass} placeholder="e.g. Image Generation"
                                        value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Tool Type</label>
                                    <select className={inputClass} value={form.tool_type}
                                        onChange={e => setForm({ ...form, tool_type: e.target.value as ToolboxToolType })}>
                                        {TOOL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Importance</label>
                                    <select className={inputClass} value={form.importance}
                                        onChange={e => setForm({ ...form, importance: e.target.value as ToolboxImportance })}>
                                        {IMPORTANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <div
                                            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                            className={`relative h-6 w-11 rounded-full border transition ${form.is_active ? 'bg-lime/20 border-lime/40' : 'bg-white/5 border-border'}`}
                                        >
                                            <span className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${form.is_active ? 'translate-x-5 bg-lime' : 'translate-x-0.5 bg-gray-500'}`} />
                                        </div>
                                        <span className="text-sm text-gray-300">Active</span>
                                    </label>
                                </div>
                            </div>

                            {form.url && (
                                <a href={form.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-lime hover:opacity-80 transition">
                                    <ExternalLink className="h-3 w-3" /> Preview link
                                </a>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-gray-300 hover:bg-white/5 transition text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-xl gradient-lime text-black font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
                                    {loading ? 'Saving…' : item ? 'Save Changes' : 'Add Tool'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
