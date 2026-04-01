import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Save, Loader2, CheckCircle2, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PlatformSetting } from '@/types/database'
import toast from 'react-hot-toast'

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

export function PlatformSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string | null>(null)

    // Fetch all relevant settings on mount
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
        const value = settings[key] ?? ''

        const { error } = await supabase
            .from('platform_settings')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert(
                { key, value, updated_at: new Date().toISOString() } as any,
                { onConflict: 'key' }
            )

        setSaving(null)
        if (error) {
            toast.error(`Failed to save: ${error.message}`)
        } else {
            setSaved(key)
            toast.success('Setting saved')
            setTimeout(() => setSaved(null), 2000)
        }
    }

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Configure platform-wide content, videos, and onboarding resources.
                </p>
            </div>

            {/* Video Settings Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-2xl overflow-hidden"
            >
                {/* Card header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                    <div className="h-9 w-9 rounded-lg bg-lime/10 flex items-center justify-center">
                        <Video className="h-4 w-4 text-lime" />
                    </div>
                    <div>
                        <h2 className="font-heading text-base font-bold">Welcome Videos</h2>
                        <p className="text-xs text-gray-500">Vimeo URLs shown to members after completing onboarding</p>
                    </div>
                </div>

                {/* Settings list */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-lime" />
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {VIDEO_SETTINGS.map((s) => (
                            <div key={s.key} className="p-6">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="font-medium text-sm text-white">{s.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        value={settings[s.key] ?? ''}
                                        onChange={(e) => handleChange(s.key, e.target.value)}
                                        placeholder="https://vimeo.com/123456789"
                                        className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/50 transition-colors"
                                    />
                                    <button
                                        onClick={() => handleSave(s.key)}
                                        disabled={saving === s.key}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-medium rounded-xl border border-lime/20 transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        {saving === s.key ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : saved === s.key ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {saved === s.key ? 'Saved' : 'Save'}
                                    </button>
                                </div>
                                {/* Live preview thumbnail */}
                                {settings[s.key] && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                                        <a
                                            href={settings[s.key]}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-lime/70 hover:text-lime underline underline-offset-2 truncate max-w-xs"
                                        >
                                            {settings[s.key]}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* More settings placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card border border-border rounded-2xl p-6 flex items-center gap-4 opacity-50"
            >
                <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-400">More settings coming soon</p>
                    <p className="text-xs text-gray-600">Certificates, email templates, branding</p>
                </div>
            </motion.div>
        </div>
    )
}
