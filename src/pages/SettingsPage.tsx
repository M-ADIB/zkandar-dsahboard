import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { User, Bell, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { userProfileSchema } from '@/lib/validation'
import toast from 'react-hot-toast'

export function SettingsPage() {
    const { user, refreshUser } = useAuth()
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const navigate = useNavigate()
    const isDev = import.meta.env.DEV

    const handleSave = async () => {
        if (!user) return

        // Validate
        const validation = userProfileSchema.safeParse({ full_name: fullName })
        if (!validation.success) {
            toast.error(validation.error.errors[0].message)
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('users')
                // @ts-expect-error - Supabase update type inference failing
                .update({ full_name: fullName })
                .eq('id', user.id)

            if (error) throw error

            await refreshUser()
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRestartOnboarding = async () => {
        if (!user) return

        setIsResetting(true)
        try {
            const { error } = await supabase
                .from('users')
                // @ts-expect-error - Supabase update type inference failing
                .update({ user_type: null })
                .eq('id', user.id)

            if (error) throw error

            await refreshUser()
            toast.success('Onboarding reset. Redirecting...')
            navigate('/onboarding')
        } catch (error) {
            console.error('Error resetting onboarding:', error)
            toast.error('Failed to reset onboarding')
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-bold">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Manage your account and preferences
                </p>
            </div>

            {/* Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <User className="h-5 w-5 text-lime" />
                    <h2 className="font-heading font-bold">Profile</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl gradient-lime flex items-center justify-center">
                            <span className="text-2xl text-black font-bold">
                                {user?.full_name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <button className="px-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition">
                                Upload Photo
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email}
                                disabled
                                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-gray-500"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Notifications Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="h-5 w-5 text-lime" />
                    <h2 className="font-heading font-bold">Notifications</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { label: 'Email notifications', description: 'Receive updates via email', enabled: true },
                        { label: 'Session reminders', description: '24h before each session', enabled: true },
                        { label: 'Assignment reminders', description: 'When assignments are due soon', enabled: true },
                        { label: 'Chat mentions', description: 'When someone mentions you', enabled: false },
                    ].map((setting, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                                <p className="font-medium text-sm">{setting.label}</p>
                                <p className="text-xs text-gray-500">{setting.description}</p>
                            </div>
                            <button
                                className={`w-12 h-6 rounded-full transition-colors relative ${setting.enabled ? 'bg-lime' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${setting.enabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Security Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-5 w-5 text-lime" />
                    <h2 className="font-heading font-bold">Security</h2>
                </div>
                <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition">
                        <div>
                            <p className="font-medium text-sm">Change Password</p>
                            <p className="text-xs text-gray-500">Update your password</p>
                        </div>
                        <span className="text-gray-400">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition">
                        <div>
                            <p className="font-medium text-sm">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500">Add extra security</p>
                        </div>
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Coming Soon</span>
                    </button>
                </div>
            </motion.div>

            {/* Developer Shortcuts */}
            {isDev && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="h-5 w-5 text-lime" />
                        <h2 className="font-heading font-bold">Developer Shortcuts</h2>
                    </div>
                    <div className="space-y-3">
                        <Link
                            to="/onboarding"
                            className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition"
                        >
                            <div>
                                <p className="font-medium text-sm">Open Master Class Onboarding</p>
                                <p className="text-xs text-gray-500">Preview the team/management flow</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                        <Link
                            to="/onboarding/sprint-workshop"
                            className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition"
                        >
                            <div>
                                <p className="font-medium text-sm">Open Sprint Workshop Placeholder</p>
                                <p className="text-xs text-gray-500">Coming soon screen</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                        <button
                            onClick={handleRestartOnboarding}
                            disabled={isResetting}
                            className="w-full flex items-center justify-between p-4 bg-bg-elevated rounded-xl hover:bg-white/5 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div>
                                <p className="font-medium text-sm">Restart onboarding (dev)</p>
                                <p className="text-xs text-gray-500">Clears user type to re-trigger onboarding</p>
                            </div>
                            {isResetting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                </button>
            </div>
        </div>
    )
}
