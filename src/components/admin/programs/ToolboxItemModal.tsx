import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Plus, Trash2, Image as ImageIcon, Video } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { Portal } from '@/components/shared/Portal'
import type { ToolboxItem, ToolboxImportance, ToolboxToolType, ToolboxSubscriptionType, ToolboxMedia } from '@/types/database'

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

const SUBSCRIPTION_OPTIONS: { value: ToolboxSubscriptionType; label: string }[] = [
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' },
    { value: 'enterprise', label: 'Enterprise' },
]

const defaultForm = {
    title: '',
    url: '',
    vimeo_url: '',
    description: '',
    importance: 'recommended' as ToolboxImportance,
    category: '',
    tool_type: 'other' as ToolboxToolType,
    subscription_type: 'paid' as ToolboxSubscriptionType,
    media: [] as ToolboxMedia[],
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
                vimeo_url: item.vimeo_url ?? '',
                description: item.description ?? '',
                importance: item.importance,
                category: item.category,
                tool_type: item.tool_type,
                subscription_type: item.subscription_type ?? 'paid',
                media: item.media ?? [],
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
        
        // Validate media arrays
        for (const m of form.media) {
            if (!m.url.trim()) {
                setError('All media items must have a valid URL.')
                return
            }
        }
        
        setLoading(true)
        setError(null)

        const payload = {
            ...form,
            vimeo_url: form.vimeo_url.trim() || null,
            description: form.description.trim() || null,
            media: form.media.length > 0 ? form.media : null,
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

    const addMedia = (type: 'video' | 'image') => {
        if (form.media.length >= 3) return
        setForm({
            ...form,
            media: [...form.media, { id: crypto.randomUUID(), type, url: '', title: '' }]
        })
    }

    const updateMedia = (id: string, updates: Partial<ToolboxMedia>) => {
        setForm({
            ...form,
            media: form.media.map(m => m.id === id ? { ...m, ...updates } : m)
        })
    }

    const removeMedia = (id: string) => {
        setForm({
            ...form,
            media: form.media.filter(m => m.id !== id)
        })
    }

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                            <h2 className="text-lg font-semibold text-white">
                                {item ? 'Edit Tool' : 'Add Tool'}
                            </h2>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6">
                            <form id="toolbox-form" onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Title *</label>
                                        <input type="text" required className={inputClass} placeholder="e.g. Midjourney"
                                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelClass}>URL *</label>
                                        <input type="url" required className={inputClass} placeholder="https://..."
                                            value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                                        {form.url && (
                                            <a href={form.url} target="_blank" rel="noopener noreferrer"
                                                className="mt-1.5 flex items-center gap-1.5 text-xs text-lime hover:opacity-80 transition">
                                                <ExternalLink className="h-3 w-3" /> Preview link
                                            </a>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <textarea rows={3} className={inputClass + ' resize-none'} placeholder="What does this tool do?"
                                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    
                                    <div>
                                        <label className={labelClass}>Vimeo Tutorial URL <span className="text-gray-500 font-normal">(Legacy / Option A)</span></label>
                                        <input type="url" className={inputClass} placeholder="https://vimeo.com/..."
                                            value={form.vimeo_url} onChange={e => setForm({ ...form, vimeo_url: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Subscription Type</label>
                                            <select className={inputClass} value={form.subscription_type}
                                                onChange={e => setForm({ ...form, subscription_type: e.target.value as ToolboxSubscriptionType })}>
                                                {SUBSCRIPTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Importance</label>
                                            <select className={inputClass} value={form.importance}
                                                onChange={e => setForm({ ...form, importance: e.target.value as ToolboxImportance })}>
                                                {IMPORTANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
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

                                    <div className="pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <div
                                                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                                className={`relative h-6 w-11 rounded-full border transition ${form.is_active ? 'bg-lime/20 border-lime/40' : 'bg-white/5 border-border'}`}
                                            >
                                                <span className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${form.is_active ? 'translate-x-5 bg-lime' : 'translate-x-0.5 bg-gray-500'}`} />
                                            </div>
                                            <span className="text-sm text-gray-300">Active - Visible to participants</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Dynamic Media Section (Option B) */}
                                <div className="pt-6 mt-6 border-t border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-white block">
                                            Media Gallery <span className="text-gray-500 font-normal">({form.media.length}/3)</span>
                                        </label>
                                        <span className="text-xs text-lime border border-lime/30 bg-lime/10 px-2 py-0.5 rounded">Option B</span>
                                    </div>

                                    <div className="space-y-4">
                                        {form.media.map((m, index) => (
                                            <div key={m.id} className="p-3 bg-white/5 border border-border rounded-xl space-y-3 relative group">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeMedia(m.id)}
                                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-400 hover:bg-black/40 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="flex items-center gap-2 pr-8 text-sm font-medium text-gray-300">
                                                    {m.type === 'video' ? <Video className="w-4 h-4 text-blue-400" /> : <ImageIcon className="w-4 h-4 text-purple-400" />}
                                                    {m.type === 'video' ? 'Video Player' : 'Image Asset'} #{index + 1}
                                                </div>

                                                <input 
                                                    type="text" 
                                                    placeholder={m.type === 'video' ? "https://vimeo.com/..." : "https://... (Image URL)"}
                                                    className={inputClass}
                                                    value={m.url}
                                                    onChange={(e) => updateMedia(m.id, { url: e.target.value })}
                                                    required
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Optional Title (e.g. Navigation Overview)"
                                                    className={inputClass}
                                                    value={m.title || ''}
                                                    onChange={(e) => updateMedia(m.id, { title: e.target.value })}
                                                />
                                            </div>
                                        ))}

                                        {form.media.length < 3 && (
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => addMedia('image')}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5 transition text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Image
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => addMedia('video')}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5 transition text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Video
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-border shrink-0 bg-bg-card">
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-gray-300 hover:bg-white/5 transition text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" form="toolbox-form" disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-xl gradient-lime text-black font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
                                    {loading ? 'Saving…' : item ? 'Save Changes' : 'Add Tool'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    )
}
