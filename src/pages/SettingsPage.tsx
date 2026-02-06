import { motion } from 'framer-motion'
import { User, Bell, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function SettingsPage() {
    const { user } = useAuth()

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
                                defaultValue={user?.full_name}
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

            {/* Save Button */}
            <div className="flex justify-end">
                <button className="px-8 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition">
                    Save Changes
                </button>
            </div>
        </div>
    )
}
