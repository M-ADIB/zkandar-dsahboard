import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Terminal, X } from 'lucide-react'

const TEST_USERS = [
    { role: 'Owner / Admin', email: 'admin@zkandar.com', password: 'password123' },
    { role: 'Participant', email: 'adib@theclips.agency', password: 'password123' },
    { role: 'Other User', email: 'test@finasi.com', password: 'password123' },
]

export function TestingCredentials() {
    const [isOpen, setIsOpen] = useState(true)
    const [copiedContent, setCopiedContent] = useState<string | null>(null)

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
        setCopiedContent(content)
        setTimeout(() => setCopiedContent(null), 2000)
    }

    // Only render in development environment to be safe, but since VITE_ENV might not be set, let's keep it visible.
    // Uncomment this if you only want it in DEV:
    // if (!import.meta.env.DEV) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] font-sans">
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.button
                        key="toggle-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-bg-elevated border border-border shadow-xl rounded-full p-3 
                            hover:border-lime/50 transition-colors group flex items-center justify-center"
                    >
                        <Terminal className="h-5 w-5 text-gray-400 group-hover:text-lime transition-colors" />
                    </motion.button>
                ) : (
                    <motion.div
                        key="credentials-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-80 bg-[#0A0A0A] border border-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-[#111111]">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-lime" />
                                <span className="text-sm font-bold text-white tracking-wide">Dev Shortcuts</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-gray-500 mb-3 px-1">
                                Click any credential to copy it to your clipboard.
                            </p>
                            
                            <div className="space-y-3">
                                {TEST_USERS.map((user, i) => (
                                    <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2.5">
                                        <div className="text-xs font-semibold text-lime/80 mb-2 uppercase tracking-wider">
                                            {user.role}
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            {/* Email */}
                                            <div 
                                                onClick={() => handleCopy(user.email)}
                                                className="flex items-center justify-between group cursor-pointer 
                                                    bg-black/50 hover:bg-black p-1.5 rounded border border-transparent 
                                                    hover:border-lime/30 transition-all"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-xs text-gray-500 w-12 shrink-0">Email:</span>
                                                    <span className="text-sm text-gray-200 truncate">{user.email}</span>
                                                </div>
                                                {copiedContent === user.email ? (
                                                    <Check className="h-3.5 w-3.5 text-lime" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5 text-gray-600 group-hover:text-lime/70 transition-colors" />
                                                )}
                                            </div>

                                            {/* Password */}
                                            <div 
                                                onClick={() => handleCopy(user.password)}
                                                className="flex items-center justify-between group cursor-pointer 
                                                    bg-black/50 hover:bg-black p-1.5 rounded border border-transparent 
                                                    hover:border-lime/30 transition-all"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-xs text-gray-500 w-12 shrink-0">Pass:</span>
                                                    <span className="text-sm text-gray-200 truncate font-mono">{user.password}</span>
                                                </div>
                                                {copiedContent === user.password ? (
                                                    <Check className="h-3.5 w-3.5 text-lime" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5 text-gray-600 group-hover:text-lime/70 transition-colors" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
