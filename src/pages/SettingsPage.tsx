import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
    User, Bell, Lock, Loader2, Sparkles, ArrowRight, Users,
    Download, Trash2, KeyRound, AlertTriangle, Camera, UserPlus, Mail,
    Briefcase, Globe, Calendar,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { userProfileSchema } from '@/lib/validation'
import toast from 'react-hot-toast'
import { AvatarCropModal } from '@/components/admin/settings/AvatarCropModal'
import { Portal } from '@/components/shared/Portal'
import { ModalForm } from '@/components/admin/shared/ModalForm'

type SettingsTab = 'profile' | 'team' | 'notifications' | 'security'

interface TabDef {
    id: SettingsTab
    label: string
    icon: React.ElementType
    adminOnly?: boolean
}

interface NotificationPrefs {
    email_notifications: boolean
    session_reminders: boolean
    assignment_reminders: boolean
    chat_mentions: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
    email_notifications: true,
    session_reminders: true,
    assignment_reminders: true,
    chat_mentions: false,
}

const NOTIF_SETTINGS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: 'email_notifications', label: 'Email notifications', description: 'Receive updates via email' },
    { key: 'session_reminders', label: 'Session reminders', description: '24h before each session' },
    { key: 'assignment_reminders', label: 'Assignment reminders', description: 'When assignments are due soon' },
    { key: 'chat_mentions', label: 'Chat mentions', description: 'When someone mentions you' },
]

const settingsTabs: TabDef[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team', icon: Users, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
]

const inputClass = 'w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white'

// ─── Team member type ─────────────────────
type TeamMember = {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
    created_at: string
}

// ─── Invite Admin Modal ─────────────────────
function InviteAdminModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const { session: authSession } = useAuth()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('admin')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) { setError('Email is required'); return }
        setIsLoading(true)
        setError(null)

        try {
            const token = authSession?.access_token
            if (!token) throw new Error('Not authenticated')

            const res = await supabase.functions.invoke('invite-team', {
                body: { first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim().toLowerCase(), role },
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.error) throw new Error(res.error.message || 'Invite failed')
            const data = res.data as { error?: string; success?: boolean }
            if (data?.error) throw new Error(data.error)

            toast.success('Invite sent successfully!')
            onSuccess()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invite')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ModalForm isOpen={isOpen} onClose={onClose} title="Invite Team Member" onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Send Invite">
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="John" />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Doe" />
                </div>
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-10`} placeholder="john@company.com" />
                </div>
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                They'll receive a branded email with temporary credentials to sign in.
            </p>
        </ModalForm>
    )
}

// ─── Main Settings Page ─────────────────────
export function SettingsPage() {
    const { user, refreshUser, signOut } = useAuth()
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [position, setPosition] = useState(user?.position || '')
    const [nationality, setNationality] = useState(user?.nationality || '')
    const [age, setAge] = useState(user?.age?.toString() || '')
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const navigate = useNavigate()
    const isDev = import.meta.env.DEV

    // Avatar
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    // Team
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [isLoadingTeam, setIsLoadingTeam] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)

    // Notification prefs
    const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
        const saved = (user?.profile_data as Record<string, unknown> | null)?.notification_prefs
        return saved ? { ...DEFAULT_PREFS, ...(saved as Partial<NotificationPrefs>) } : DEFAULT_PREFS
    })
    const [savingPref, setSavingPref] = useState<string | null>(null)

    // Security tab
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [isSavingPassword, setIsSavingPassword] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    const isAdmin = user?.role === 'owner' || user?.role === 'admin'
    const visibleTabs = settingsTabs.filter((t) => !t.adminOnly || isAdmin)

    // Keep fields in sync
    useEffect(() => {
        setFullName(user?.full_name || '')
        setPosition(user?.position || '')
        setNationality(user?.nationality || '')
        setAge(user?.age?.toString() || '')
    }, [user?.full_name, user?.position, user?.nationality, user?.age])

    // Load team members
    const loadTeam = useCallback(async () => {
        setIsLoadingTeam(true)
        const { data } = await supabase
            .from('users')
            .select('id, full_name, email, role, avatar_url, created_at')
            .in('role', ['owner', 'admin'])
            .order('created_at', { ascending: true })
        setTeamMembers((data as TeamMember[]) ?? [])
        setIsLoadingTeam(false)
    }, [])

    useEffect(() => {
        if (activeTab === 'team' && isAdmin) loadTeam()
    }, [activeTab, isAdmin, loadTeam])

    // ─── Avatar handlers ─────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setCropImageSrc(reader.result as string)
        reader.readAsDataURL(file)
        e.target.value = '' // reset so re-selecting same file triggers onChange
    }

    const handleCropComplete = async (blob: Blob) => {
        if (!user) return
        setIsUploadingAvatar(true)
        try {
            const filePath = `${user.id}/avatar.webp`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { contentType: 'image/webp', upsert: true })
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl } as never)
                .eq('id', user.id)
            if (dbError) throw dbError

            await refreshUser()
            toast.success('Profile picture updated!')
            setCropImageSrc(null)
        } catch {
            toast.error('Failed to upload profile picture')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    // ─── Profile save ─────────────────────
    const handleSave = async () => {
        if (!user) return
        const validation = userProfileSchema.safeParse({ full_name: fullName })
        if (!validation.success) { toast.error(validation.error.errors[0].message); return }
        setIsSaving(true)
        try {
            const updatePayload: Record<string, unknown> = { full_name: fullName }
            if (position !== (user.position || '')) updatePayload.position = position || null
            if (nationality !== (user.nationality || '')) updatePayload.nationality = nationality || null
            const ageNum = age ? parseInt(age) : null
            if (ageNum !== user.age) updatePayload.age = ageNum

            const { error } = await supabase.from('users').update(updatePayload as never).eq('id', user.id)
            if (error) throw error
            await refreshUser()
            toast.success('Profile updated successfully')
        } catch {
            toast.error('Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRestartOnboarding = async () => {
        if (!user) return
        setIsResetting(true)
        try {
            const { error } = await supabase.from('users').update({ user_type: null } as never).eq('id', user.id)
            if (error) throw error
            await refreshUser()
            toast.success('Onboarding reset. Redirecting...')
            navigate('/onboarding')
        } catch {
            toast.error('Failed to reset onboarding')
        } finally {
            setIsResetting(false)
        }
    }

    const handleTogglePref = useCallback(async (key: keyof NotificationPrefs) => {
        if (!user) return
        const next = { ...prefs, [key]: !prefs[key] }
        setPrefs(next)
        setSavingPref(key)
        try {
            const existingData = (user.profile_data as Record<string, unknown> | null) ?? {}
            const { error } = await supabase
                .from('users')
                .update({ profile_data: { ...existingData, notification_prefs: next } } as never)
                .eq('id', user.id)
            if (error) throw error
        } catch {
            setPrefs(prefs)
            toast.error('Failed to save preference')
        } finally {
            setSavingPref(null)
        }
    }, [user, prefs])

    const handleChangePassword = async () => {
        setPasswordError(null)
        if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
        if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
        setIsSavingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            toast.success('Password updated successfully!')
            setShowPasswordConfirm(false)
            setNewPassword('')
            setConfirmPassword('')
        } catch {
            toast.error('Failed to update password')
        } finally {
            setIsSavingPassword(false)
        }
    }

    const handleExportData = async () => {
        if (!user) return
        setIsExporting(true)
        try {
            const [submissionsRes, chatRes] = await Promise.all([
                supabase.from('assignment_submissions').select('*').eq('user_id', user.id),
                supabase.from('chat_messages').select('*').eq('user_id', user.id),
            ])

            const exportData = {
                exported_at: new Date().toISOString(),
                profile: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    nationality: user.nationality,
                    age: user.age,
                    position: user.position,
                    created_at: user.created_at,
                },
                submissions: submissionsRes.data ?? [],
                chat_messages: chatRes.data ?? [],
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `zkandar-data-export-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Data export downloaded')
        } catch {
            toast.error('Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirmEmail !== user.email) {
            toast.error('Email does not match')
            return
        }
        setIsDeleting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error ?? 'Delete failed')
            }
            toast.success('Account deleted. Goodbye!')
            await signOut()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete account')
            setIsDeleting(false)
        }
    }

    const avatarUrl = user?.avatar_url

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">Manage your account, team, and preferences</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-bg-card border border-border rounded-2xl p-1 w-fit flex-wrap">
                {visibleTabs.map((tab) => {
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
                                    layoutId="settingsActiveTab"
                                    className="absolute inset-0 rounded-xl gradient-lime"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <Icon className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* ── Profile Tab ── */}
                {activeTab === 'profile' && (
                    <div className="max-w-3xl space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <User className="h-5 w-5 text-lime" />
                                <h2 className="font-heading font-bold">Profile</h2>
                            </div>
                            <div className="space-y-5">
                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar"
                                                className="h-20 w-20 rounded-2xl object-cover border-2 border-border"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 rounded-2xl gradient-lime flex items-center justify-center">
                                                <span className="text-2xl text-black font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingAvatar}
                                            className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                        >
                                            {isUploadingAvatar ? (
                                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                                            ) : (
                                                <Camera className="h-5 w-5 text-white" />
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition"
                                        >
                                            Upload Photo
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                                    </div>
                                </div>

                                {/* Name & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                                        <input
                                            type="email"
                                            defaultValue={user?.email}
                                            disabled
                                            className={`${inputClass} !text-gray-500`}
                                        />
                                    </div>
                                </div>

                                {/* Extended fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <Briefcase className="h-3.5 w-3.5" /> Job Title
                                        </label>
                                        <input
                                            type="text"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. Senior Architect"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <Globe className="h-3.5 w-3.5" /> Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={nationality}
                                            onChange={(e) => setNationality(e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. UAE"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Age
                                        </label>
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            className={inputClass}
                                            placeholder="30"
                                            min="16"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                {/* Role badge */}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-xs text-gray-500">Role:</span>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-lime/10 text-lime border border-lime/20 uppercase tracking-wider">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {isDev && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-bg-card border border-border rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="h-5 w-5 text-lime" />
                                    <h2 className="font-heading font-bold">Developer Shortcuts</h2>
                                </div>
                                <div className="space-y-3">
                                    <Link to="/onboarding" className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition">
                                        <div>
                                            <p className="font-medium text-sm">Open Master Class Onboarding</p>
                                            <p className="text-xs text-gray-500">Preview the team/management flow</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </Link>
                                    <Link to="/onboarding/sprint-workshop" className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition">
                                        <div>
                                            <p className="font-medium text-sm">Open Sprint Workshop Placeholder</p>
                                            <p className="text-xs text-gray-500">Coming soon screen</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </Link>
                                    <button
                                        onClick={handleRestartOnboarding}
                                        disabled={isResetting}
                                        className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition disabled:opacity-70"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">Restart onboarding (dev)</p>
                                            <p className="text-xs text-gray-500">Clears user type to re-trigger onboarding</p>
                                        </div>
                                        {isResetting ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <ArrowRight className="h-4 w-4 text-gray-400" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Team Tab ── */}
                {activeTab === 'team' && isAdmin && (
                    <div className="max-w-3xl space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-lime" />
                                    <h2 className="font-heading font-bold">Zkandar AI Team</h2>
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{teamMembers.length} members</span>
                                </div>
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black font-bold text-sm rounded-xl hover:opacity-90 transition"
                                >
                                    <UserPlus className="h-4 w-4" /> Invite
                                </button>
                            </div>

                            {isLoadingTeam ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
                                                        {member.full_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm text-white">{member.full_name}</p>
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                                                member.role === 'owner'
                                                    ? 'bg-lime/10 text-lime border border-lime/20'
                                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                            }`}>
                                                {member.role}
                                            </span>
                                        </div>
                                    ))}
                                    {teamMembers.length === 0 && (
                                        <p className="text-center text-sm text-gray-500 py-8">No team members yet. Invite your first admin!</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* ── Notifications Tab ── */}
                {activeTab === 'notifications' && (
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Bell className="h-5 w-5 text-lime" />
                                <h2 className="font-heading font-bold">Notifications</h2>
                            </div>
                            <div className="space-y-4">
                                {NOTIF_SETTINGS.map(({ key, label, description }) => (
                                    <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                        <div>
                                            <p className="font-medium text-sm">{label}</p>
                                            <p className="text-xs text-gray-500">{description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleTogglePref(key)}
                                            disabled={savingPref === key}
                                            className={`w-12 h-6 rounded-full transition-colors relative disabled:opacity-60 ${prefs[key] ? 'bg-lime' : 'bg-gray-600'}`}
                                            aria-checked={prefs[key]}
                                            role="switch"
                                            aria-label={label}
                                        >
                                            {savingPref === key
                                                ? <Loader2 className="absolute top-1 left-1 h-4 w-4 animate-spin text-gray-800" />
                                                : <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${prefs[key] ? 'left-7' : 'left-1'}`} />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* ── Security Tab ── */}
                {activeTab === 'security' && (
                    <div className="max-w-3xl space-y-6">
                        {/* Authentication */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Lock className="h-5 w-5 text-lime" />
                                <h2 className="font-heading font-bold">Authentication</h2>
                            </div>
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowPasswordConfirm(true)}
                                    className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <KeyRound className="h-4 w-4 text-gray-400" />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Reset Password</p>
                                            <p className="text-xs text-gray-500">Set a new password for your account</p>
                                        </div>
                                    </div>
                                    <span className="text-gray-400 text-sm">→</span>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition">
                                    <div className="flex items-center gap-3">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Two-Factor Authentication</p>
                                            <p className="text-xs text-gray-500">Add extra security to your account</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Coming Soon</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* GDPR / Data */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Download className="h-5 w-5 text-lime" />
                                <h2 className="font-heading font-bold">Your Data</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between p-4 bg-bg-elevated rounded-xl">
                                    <div>
                                        <p className="font-medium text-sm">Download my data</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Export your profile, submissions, and messages as JSON</p>
                                    </div>
                                    <button
                                        onClick={handleExportData}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition disabled:opacity-70 whitespace-nowrap ml-4"
                                    >
                                        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                        Export
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Danger Zone */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-card border border-red-500/30 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                <h2 className="font-heading font-bold text-red-400">Danger Zone</h2>
                            </div>
                            <div className="flex items-start justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                                <div>
                                    <p className="font-medium text-sm">Delete account</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all associated data. This cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/20 transition whitespace-nowrap ml-4"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>

            {/* ── Modals ── */}
            {cropImageSrc && (
                <AvatarCropModal
                    isOpen={!!cropImageSrc}
                    onClose={() => setCropImageSrc(null)}
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCropComplete}
                />
            )}

            <InviteAdminModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={loadTeam}
            />

            {/* Password Reset Modal */}
            {showPasswordConfirm && (
                <Portal>
                    <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <KeyRound className="h-5 w-5 text-lime shrink-0" />
                            <h2 className="font-heading font-bold">Reset Password</h2>
                        </div>
                        {passwordError && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 mb-4">{passwordError}</div>
                        )}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Min. 6 characters"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Repeat your new password"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPasswordConfirm(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(null) }}
                                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={isSavingPassword || !newPassword}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 gradient-lime text-black rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                            >
                                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                Update Password
                            </button>
                        </div>
                        </motion.div>
                    </div>
                </Portal>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <Portal>
                    <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-bg-card border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                            <h2 className="font-heading font-bold text-red-400">Delete your account?</h2>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            This will permanently delete your account and all your data. This action <strong className="text-white">cannot be undone</strong>.
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                            Type <span className="text-white font-mono">{user?.email}</span> to confirm:
                        </p>
                        <input
                            type="email"
                            value={deleteConfirmEmail}
                            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                            placeholder={user?.email}
                            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-red-500/50 mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail('') }}
                                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmEmail !== user?.email}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete Account
                            </button>
                        </div>
                        </motion.div>
                    </div>
                </Portal>
            )}
        </div>
    )
}
