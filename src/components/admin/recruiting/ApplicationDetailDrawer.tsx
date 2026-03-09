import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, Globe, Clock, DollarSign, Briefcase, Video, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobApplication, ApplicationStatus } from '@/types/database'

interface ApplicationDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    application: JobApplication | null
    onUpdate: (updated: JobApplication) => void
}

const STATUS_CONFIG: Record<ApplicationStatus, { bg: string; text: string; border: string; label: string }> = {
    new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'New' },
    reviewing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Reviewing' },
    shortlisted: { bg: 'bg-[#D0FF71]/10', text: 'text-[#D0FF71]', border: 'border-[#D0FF71]/20', label: 'Shortlisted' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Rejected' },
    hired: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Hired' },
}

const POSITION_LABELS: Record<string, string> = {
    sales_closer: 'High-Ticket Closer',
    video_editor: 'Video Editor',
}

export function ApplicationDetailDrawer({ isOpen, onClose, application, onUpdate }: ApplicationDetailDrawerProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')

    useEffect(() => {
        setAdminNotes(application?.admin_notes || '')
    }, [application])

    if (!isOpen || !application) return null

    const statusCfg = STATUS_CONFIG[application.status] ?? STATUS_CONFIG.new

    const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
        setIsUpdating(true)
        try {
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .update({ status: newStatus, admin_notes: adminNotes })
                .eq('id', application.id)
                .select()
                .single()
            if (error) throw error
            onUpdate(data)
        } catch (err) {
            console.error('Error updating status:', err)
            alert('Failed to update. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleSaveNotes = async () => {
        setIsUpdating(true)
        try {
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .update({ admin_notes: adminNotes })
                .eq('id', application.id)
                .select()
                .single()
            if (error) throw error
            onUpdate(data)
        } catch (err) {
            console.error('Error saving notes:', err)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-2xl bg-[#0B0B0B] border-l border-white/5 shadow-2xl flex flex-col h-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-white/5 bg-[#111] shrink-0">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                {POSITION_LABELS[application.position_type] ?? application.position_type}
                            </p>
                            <h2 className="text-xl font-bold text-white">{application.full_name}</h2>
                            <p className="text-gray-400 text-sm mt-0.5">{application.country} · {application.timezone}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <select
                                value={application.status}
                                onChange={e => handleStatusUpdate(e.target.value as ApplicationStatus)}
                                disabled={isUpdating}
                                className={`outline-none px-3 py-2 rounded-xl text-sm font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} cursor-pointer`}
                            >
                                <option value="new">New</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                            </select>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Contact */}
                        <section>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Details</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                    <Mail className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Email</div>
                                        <a href={`mailto:${application.email}`} className="text-white text-sm hover:text-[#D0FF71] transition-colors break-all">{application.email}</a>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                    <Phone className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">WhatsApp / Phone</div>
                                        <div className="text-white text-sm">{application.phone}</div>
                                    </div>
                                </div>
                                {application.linkedin_url && (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Globe className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">LinkedIn</div>
                                            <a
                                                href={application.linkedin_url.startsWith('http') ? application.linkedin_url : `https://${application.linkedin_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white text-sm hover:text-[#D0FF71] transition-colors flex items-center gap-1"
                                            >
                                                View Profile <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                    <Clock className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Timezone</div>
                                        <div className="text-white text-sm">{application.timezone}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sales Profile */}
                        <section>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Sales Profile</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                    <div className="text-xs text-gray-500 mb-1">Compensation Model</div>
                                    <div className="text-white font-medium text-sm capitalize">
                                        {application.compensation_model.replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                    <div className="text-xs text-gray-500 mb-1">Years in High-Ticket Sales</div>
                                    <div className="text-white font-medium text-sm">{application.years_experience}</div>
                                </div>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                    <div className="text-xs text-gray-500 mb-1">Avg Deal Size (Last Role)</div>
                                    <div className="text-white font-medium text-sm">{application.avg_deal_size}</div>
                                </div>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                    <DollarSign className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Expected Monthly</div>
                                        <div className="text-white font-medium text-sm">{application.expected_monthly_earnings || '—'}</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl col-span-2">
                                    <div className="text-xs text-gray-500 mb-1">Sold Info Products Before?</div>
                                    <div className="text-white text-sm">{application.sold_info_products}</div>
                                </div>
                                {application.crm_tools.length > 0 && (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl col-span-2">
                                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5" /> CRM Tools
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {application.crm_tools.map(t => (
                                                <span key={t} className="px-3 py-1 bg-white/5 rounded-full text-xs text-[#D0FF71] border border-white/10">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Open-Ended */}
                        <section>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Written Responses</h3>
                            <div className="space-y-4">
                                {application.best_close_story && (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                        <div className="text-xs font-semibold text-[#D0FF71] mb-2">Most Impressive Close</div>
                                        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{application.best_close_story}</p>
                                    </div>
                                )}
                                {application.why_zkandar && (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                        <div className="text-xs font-semibold text-[#D0FF71] mb-2">Why Zkandar AI?</div>
                                        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{application.why_zkandar}</p>
                                    </div>
                                )}
                                {application.video_intro_url && (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Video className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Video Introduction</div>
                                            <a
                                                href={application.video_intro_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#D0FF71] text-sm hover:underline flex items-center gap-1"
                                            >
                                                Watch video <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Admin Notes */}
                        <section className="pb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Internal Notes</h3>
                                {adminNotes !== (application.admin_notes || '') && (
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={isUpdating}
                                        className="text-xs bg-[#D0FF71] text-black font-semibold px-3 py-1 rounded-lg hover:bg-[#b5e55e] transition-colors"
                                    >
                                        {isUpdating ? 'Saving...' : 'Save Notes'}
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this applicant..."
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#D0FF71]/50 min-h-[120px] resize-none text-sm"
                            />
                            <p className="text-xs text-gray-600 mt-2">Visible to admins only.</p>
                        </section>

                        <div className="text-xs text-gray-600 text-center pb-4">
                            Applied on {new Date(application.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
