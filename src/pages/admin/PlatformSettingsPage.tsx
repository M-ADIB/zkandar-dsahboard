import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Video,
    Save,
    Loader2,
    CheckCircle2,
    GraduationCap,
    Plus,
    Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PlatformSetting, SubmissionFormat } from '@/types/database'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentTemplate = {
    session_number: number
    title: string
    description: string
    submission_format: SubmissionFormat
    due_days_after_session: number
}

type PlatformTab = 'welcome_videos' | 'sprint_workshop'

const tabs: { id: PlatformTab; label: string; icon: React.ElementType }[] = [
    { id: 'welcome_videos', label: 'Welcome Videos', icon: Video },
    { id: 'sprint_workshop', label: 'Sprint Workshop', icon: GraduationCap },
]

const inputClass =
    'w-full px-3 py-2 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/50 transition-colors'
const labelClass = 'block text-xs font-medium text-gray-400 mb-1'

// ─── Welcome Videos Tab ───────────────────────────────────────────────────────

const VIDEO_SETTINGS: { key: string; label: string; description: string }[] = [
    {
        key: 'welcome_video_team',
        label: 'Welcome Video — Team & Sprint Members',
        description: 'Shown to team members and sprint workshop participants after onboarding.',
    },
    {
        key: 'welcome_video_management',
        label: 'Welcome Video — Management',
        description: 'Shown to management-role users after completing their onboarding survey.',
    },
]

function WelcomeVideosTab() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true)
            const keys = VIDEO_SETTINGS.map((s) => s.key)
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .in('key', keys)
                .returns<PlatformSetting[]>()
            if (!error && data) {
                const map: Record<string, string> = {}
                data.forEach((s) => { map[s.key] = s.value })
                setSettings(map)
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    async function handleSave(key: string) {
        setSaving(key)
        const { error } = await supabase
            .from('platform_settings')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert({ key, value: settings[key] ?? '', updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
        setSaving(null)
        if (error) {
            toast.error(`Failed to save: ${error.message}`)
        } else {
            setSaved(key)
            toast.success('Setting saved')
            setTimeout(() => setSaved(null), 2000)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-lime" />
            </div>
        )
    }

    return (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <div className="h-9 w-9 rounded-lg bg-lime/10 flex items-center justify-center">
                    <Video className="h-4 w-4 text-lime" />
                </div>
                <div>
                    <h2 className="font-heading text-base font-bold">Welcome Videos</h2>
                    <p className="text-xs text-gray-500">Vimeo URLs shown to members after completing onboarding</p>
                </div>
            </div>
            <div className="divide-y divide-border">
                {VIDEO_SETTINGS.map((s) => (
                    <div key={s.key} className="p-6">
                        <div className="mb-3">
                            <p className="font-medium text-sm text-white">{s.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="url"
                                value={settings[s.key] ?? ''}
                                onChange={(e) => setSettings((prev) => ({ ...prev, [s.key]: e.target.value }))}
                                placeholder="https://vimeo.com/123456789"
                                className={inputClass}
                            />
                            <button
                                onClick={() => handleSave(s.key)}
                                disabled={saving === s.key}
                                className="flex items-center gap-2 px-4 py-2.5 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-medium rounded-xl border border-lime/20 transition-colors disabled:opacity-50 shrink-0"
                            >
                                {saving === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : saved === s.key ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                {saved === s.key ? 'Saved' : 'Save'}
                            </button>
                        </div>
                        {settings[s.key] && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                                <a href={settings[s.key]} target="_blank" rel="noreferrer" className="text-xs text-lime/70 hover:text-lime underline underline-offset-2 truncate max-w-xs">
                                    {settings[s.key]}
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Sprint Workshop Tab ──────────────────────────────────────────────────────

const SUBMISSION_FORMATS: SubmissionFormat[] = ['any', 'file', 'link', 'text']

const DEFAULT_TEMPLATE: AssignmentTemplate = {
    session_number: 1,
    title: '',
    description: '',
    submission_format: 'any',
    due_days_after_session: 3,
}

function SprintWorkshopTab() {
    const [sessionCount, setSessionCount] = useState(3)
    const [templates, setTemplates] = useState<AssignmentTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [savingCount, setSavingCount] = useState(false)
    const [savingTemplates, setSavingTemplates] = useState(false)
    const [savedCount, setSavedCount] = useState(false)
    const [savedTemplates, setSavedTemplates] = useState(false)

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true)
            const { data } = await supabase
                .from('platform_settings')
                .select('key, value')
                .in('key', ['sprint_session_count', 'sprint_assignment_templates'])
                .returns<PlatformSetting[]>()
            const map: Record<string, string> = {}
            ;(data ?? []).forEach((s) => { map[s.key] = s.value })
            if (map.sprint_session_count) setSessionCount(parseInt(map.sprint_session_count))
            if (map.sprint_assignment_templates) {
                try { setTemplates(JSON.parse(map.sprint_assignment_templates)) } catch { /* ignore */ }
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    async function saveSessionCount() {
        setSavingCount(true)
        const { error } = await supabase
            .from('platform_settings')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert({ key: 'sprint_session_count', value: String(sessionCount), updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
        setSavingCount(false)
        if (error) { toast.error(error.message) } else { setSavedCount(true); toast.success('Session count saved'); setTimeout(() => setSavedCount(false), 2000) }
    }

    async function saveTemplates() {
        setSavingTemplates(true)
        const { error } = await supabase
            .from('platform_settings')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert({ key: 'sprint_assignment_templates', value: JSON.stringify(templates), updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
        setSavingTemplates(false)
        if (error) { toast.error(error.message) } else { setSavedTemplates(true); toast.success('Templates saved'); setTimeout(() => setSavedTemplates(false), 2000) }
    }

    function updateTemplate(idx: number, field: keyof AssignmentTemplate, value: string | number) {
        setTemplates((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
    }

    function addTemplate() {
        setTemplates((prev) => [...prev, { ...DEFAULT_TEMPLATE, session_number: prev.length + 1 }])
    }

    function removeTemplate(idx: number) {
        setTemplates((prev) => prev.filter((_, i) => i !== idx))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-lime" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Session Count */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                    <div className="h-9 w-9 rounded-lg bg-lime/10 flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-lime" />
                    </div>
                    <div>
                        <h2 className="font-heading text-base font-bold">Session Configuration</h2>
                        <p className="text-xs text-gray-500">Controls how many sessions are auto-created when a new Sprint Workshop is created</p>
                    </div>
                </div>
                <div className="p-6">
                    <label className={labelClass}>Number of sessions per sprint</label>
                    <div className="flex items-center gap-3 max-w-xs">
                        <input
                            type="number"
                            min={2}
                            max={5}
                            value={sessionCount}
                            onChange={(e) => setSessionCount(Math.max(2, Math.min(5, parseInt(e.target.value) || 2)))}
                            className={inputClass}
                        />
                        <button
                            onClick={saveSessionCount}
                            disabled={savingCount}
                            className="flex items-center gap-2 px-4 py-2.5 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-medium rounded-xl border border-lime/20 transition-colors disabled:opacity-50 shrink-0"
                        >
                            {savingCount ? <Loader2 className="h-4 w-4 animate-spin" /> : savedCount ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {savedCount ? 'Saved' : 'Save'}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Currently: <span className="text-white font-medium">{sessionCount} sessions</span> auto-created per sprint.
                        Supports 2–5. Only affects new programs — existing sessions are unchanged.
                    </p>
                </div>
            </div>

            {/* Assignment Templates */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-lime/10 flex items-center justify-center">
                            <GraduationCap className="h-4 w-4 text-lime" />
                        </div>
                        <div>
                            <h2 className="font-heading text-base font-bold">Assignment Templates</h2>
                            <p className="text-xs text-gray-500">Default assignments auto-created for each new Sprint Workshop</p>
                        </div>
                    </div>
                    <button
                        onClick={addTemplate}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-lime border border-lime/30 rounded-xl hover:bg-lime/10 transition-colors shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Template
                    </button>
                </div>

                {templates.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No templates — click "Add Template" to create the first one.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {templates.map((t, idx) => (
                            <div key={idx} className="p-6 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Template {idx + 1}</span>
                                    <button
                                        onClick={() => removeTemplate(idx)}
                                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Session Number</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={sessionCount}
                                            value={t.session_number}
                                            onChange={(e) => updateTemplate(idx, 'session_number', parseInt(e.target.value) || 1)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Submission Format</label>
                                        <select
                                            value={t.submission_format}
                                            onChange={(e) => updateTemplate(idx, 'submission_format', e.target.value)}
                                            className={inputClass}
                                        >
                                            {SUBMISSION_FORMATS.map((f) => (
                                                <option key={f} value={f}>{f.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Due (days after session)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={t.due_days_after_session}
                                            onChange={(e) => updateTemplate(idx, 'due_days_after_session', parseInt(e.target.value) || 0)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input
                                        type="text"
                                        value={t.title}
                                        onChange={(e) => updateTemplate(idx, 'title', e.target.value)}
                                        placeholder="e.g. Session 1 Reflection"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Instructions (shown to members)</label>
                                    <textarea
                                        value={t.description}
                                        onChange={(e) => updateTemplate(idx, 'description', e.target.value)}
                                        rows={3}
                                        placeholder="What should members submit for this assignment?"
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-6 py-4 border-t border-border flex justify-end">
                    <button
                        onClick={saveTemplates}
                        disabled={savingTemplates}
                        className="flex items-center gap-2 px-5 py-2.5 gradient-lime text-black text-sm font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                    >
                        {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : savedTemplates ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {savedTemplates ? 'Saved!' : 'Save Templates'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PlatformSettingsPage() {
    const [activeTab, setActiveTab] = useState<PlatformTab>('welcome_videos')

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Configure platform-wide content, program defaults, and onboarding resources.
                </p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-1 w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="platformSettingsTab"
                                    className="absolute inset-0 rounded-xl gradient-lime"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <Icon className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {activeTab === 'welcome_videos' && (
                <motion.div key="welcome_videos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <WelcomeVideosTab />
                </motion.div>
            )}
            {activeTab === 'sprint_workshop' && (
                <motion.div key="sprint_workshop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <SprintWorkshopTab />
                </motion.div>
            )}
        </div>
    )
}
