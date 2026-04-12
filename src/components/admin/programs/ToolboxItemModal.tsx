import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Plus, Trash2, Image as ImageIcon, Video, Upload, Loader2 } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { Portal } from '@/components/shared/Portal'
import toast from 'react-hot-toast'
import type { ToolboxItem, ToolboxImportance, ToolboxSubscriptionType, ToolboxMedia } from '@/types/database'

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5 MB

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

const TOOL_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'video_generation', label: 'Video Generation' },
    { value: 'text_generation', label: 'Text Generation' },
    { value: 'automation', label: 'Automation' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'other', label: 'Other' },
]

const VISIBLE_TO_OPTIONS: { value: string; label: string }[] = [
    { value: 'management', label: 'Management' },
    { value: 'team', label: 'Team' },
    { value: 'sprint_member', label: 'Sprint Workshop' },
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
    logo_url: '',
    vimeo_url: '',
    description: '',
    importance: 'recommended' as ToolboxImportance,
    tool_types: [] as string[],
    visible_to: ['management', 'team', 'sprint_member'] as string[],
    subscription_type: 'paid' as ToolboxSubscriptionType,
    media: [] as ToolboxMedia[],
}

const inputClass = 'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-lime/50 transition'
const labelClass = 'block text-sm font-medium text-gray-300 mb-1'

export function ToolboxItemModal({ isOpen, onClose, onSuccess, item }: ToolboxItemModalProps) {
    const supabase = useSupabase()
    const [form, setForm] = useState(defaultForm)
    const [loading, setLoading] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleLogoUpload(file: File) {
        if (file.size > MAX_LOGO_SIZE) {
            toast.error('Image must be under 5 MB')
            return
        }
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed')
            return
        }
        setLogoUploading(true)
        const ext = file.name.split('.').pop() ?? 'png'
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage
            .from('toolbox-logos')
            .upload(path, file, { upsert: false, contentType: file.type })
        if (uploadErr) {
            toast.error(`Upload failed: ${uploadErr.message}`)
            setLogoUploading(false)
            return
        }
        const { data: { publicUrl } } = supabase.storage
            .from('toolbox-logos')
            .getPublicUrl(path)
        setForm(f => ({ ...f, logo_url: publicUrl }))
        setLogoUploading(false)
    }

    useEffect(() => {
        if (item) {
            setForm({
                title: item.title,
                url: item.url,
                logo_url: item.logo_url ?? '',
                vimeo_url: item.vimeo_url ?? '',
                description: item.description ?? '',
                importance: item.importance,
                tool_types: Array.isArray(item.tool_types) && item.tool_types.length > 0
                    ? item.tool_types
                    : [item.tool_type],
                visible_to: Array.isArray(item.visible_to)
                    ? item.visible_to
                    : (item.is_active ? ['management', 'team', 'sprint_member'] : []),
                subscription_type: item.subscription_type ?? 'paid',
                media: item.media ?? [],
            })
        } else {
            setForm(defaultForm)
        }
        setError(null)
    }, [item, isOpen])

    const toggleToolType = (value: string) => {
        setForm(f => ({
            ...f,
            tool_types: f.tool_types.includes(value)
                ? f.tool_types.filter(t => t !== value)
                : [...f.tool_types, value],
        }))
    }

    const toggleVisibleTo = (value: string) => {
        setForm(f => ({
            ...f,
            visible_to: f.visible_to.includes(value)
                ? f.visible_to.filter(v => v !== value)
                : [...f.visible_to, value],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim() || !form.url.trim()) {
            setError('Title and URL are required.')
            return
        }
        for (const m of form.media) {
            if (!m.url.trim()) {
                setError('All media items must have a valid URL.')
                return
            }
        }

        setLoading(true)
        setError(null)

        const payload = {
            title: form.title.trim(),
            url: form.url.trim(),
            logo_url: form.logo_url.trim() || null,
            vimeo_url: form.vimeo_url.trim() || null,
            description: form.description.trim() || null,
            importance: form.importance,
            tool_types: form.tool_types,
            // keep legacy field in sync with first selected type
            tool_type: form.tool_types[0] ?? 'other',
            visible_to: form.visible_to,
            is_active: form.visible_to.length > 0,
            subscription_type: form.subscription_type,
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
                                    {/* Logo + Title row */}
                                    <div className="flex items-start gap-3">
                                        {/* Logo upload */}
                                        <div className="shrink-0">
                                            <label className={labelClass}>Logo</label>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={logoUploading}
                                                className="relative h-14 w-14 rounded-xl bg-bg-elevated border border-border flex items-center justify-center overflow-hidden hover:border-lime/40 transition group"
                                            >
                                                {logoUploading ? (
                                                    <Loader2 className="h-5 w-5 text-lime animate-spin" />
                                                ) : form.logo_url ? (
                                                    <>
                                                        <img
                                                            src={form.logo_url}
                                                            alt=""
                                                            className="h-full w-full object-contain p-1"
                                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                            <Upload className="h-4 w-4 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-gray-300 transition">
                                                        <Upload className="h-4 w-4" />
                                                        <span className="text-[10px]">Upload</span>
                                                    </div>
                                                )}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleLogoUpload(file)
                                                    e.target.value = ''
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className={labelClass}>Title *</label>
                                            <input type="text" required className={inputClass} placeholder="e.g. Midjourney"
                                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                            {form.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                                                    className="mt-1.5 text-xs text-gray-500 hover:text-red-400 transition"
                                                >
                                                    Remove logo
                                                </button>
                                            )}
                                        </div>
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

                                    {/* Tool Types — multi-select chips */}
                                    <div>
                                        <label className={labelClass}>Tool Type <span className="text-gray-500 font-normal">(select all that apply)</span></label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {TOOL_TYPE_OPTIONS.map(opt => {
                                                const active = form.tool_types.includes(opt.value)
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => toggleToolType(opt.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                            active
                                                                ? 'bg-lime/15 text-lime border-lime/40'
                                                                : 'bg-white/5 text-gray-400 border-border hover:border-gray-500 hover:text-gray-300'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Visible To — multi-select chips */}
                                    <div>
                                        <label className={labelClass}>Visible To <span className="text-gray-500 font-normal">(who can see this tool)</span></label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {VISIBLE_TO_OPTIONS.map(opt => {
                                                const active = form.visible_to.includes(opt.value)
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => toggleVisibleTo(opt.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                            active
                                                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                                                                : 'bg-white/5 text-gray-400 border-border hover:border-gray-500 hover:text-gray-300'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {form.visible_to.length === 0 && (
                                            <p className="mt-1.5 text-xs text-yellow-400">No audience selected — tool will be hidden from all users.</p>
                                        )}
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
