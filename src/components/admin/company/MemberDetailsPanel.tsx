import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Briefcase, GraduationCap, CheckCircle2, Clock, BarChart3, Brain, Target, Calendar } from 'lucide-react'
import { User } from '@/types/database'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MemberDetailsPanelProps {
    member: User | null
    onClose: () => void
    companyId: string | undefined
}

export function MemberDetailsPanel({ member, onClose, companyId }: MemberDetailsPanelProps) {
    const [teamSub, setTeamSub] = useState<any>(null)
    const [mgmtSub, setMgmtSub] = useState<any>(null)
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!member || !companyId) return

        const fetchDetails = async () => {
            setLoading(true)

            // Fetch survey data (fuzzy matching by email or name since it's mock data)
            const [teamRes, mgmtRes, subsRes] = await Promise.all([
                supabase.from('team_submissions')
                    .select('*')
                    .eq('company_id', companyId)
                    .ilike('email', member.email || '')
                    .maybeSingle(),
                supabase.from('management_submissions')
                    .select('*')
                    .eq('company_id', companyId)
                    .ilike('email', member.email || '')
                    .maybeSingle(),
                supabase.from('submissions')
                    .select('*, assignment:assignments(*)')
                    .eq('user_id', member.id)
            ])

            setTeamSub(teamRes.data)
            setMgmtSub(mgmtRes.data)
            setSubmissions(subsRes.data || [])
            setLoading(false)
        }

        fetchDetails()
    }, [member, companyId])

    if (!member) return null

    // Helper to render score bars
    const ScoreBar = ({ label, value }: { label: string, value: number | null }) => (
        <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className={`font-semibold ${value && value >= 7 ? 'text-lime' : value && value >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {value ? `${value}/10` : '—'}
                </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${value && value >= 7 ? 'bg-lime' : value && value >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${(value || 0) * 10}%` }}
                />
            </div>
        </div>
    )

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
                    className="relative w-full max-w-xl h-full bg-[#111111] border-l border-border shadow-2xl overflow-y-auto"
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#111111]/80 backdrop-blur-md border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-lime/10 flex items-center justify-center shrink-0">
                                <span className="text-lime text-xl font-bold">{member.full_name?.charAt(0) || '?'}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{member.full_name}</h2>
                                <p className="text-sm text-gray-400 capitalize">{member.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Profile Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <Mail className="h-4 w-4 text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500 mb-1">Email Address</p>
                                <p className="text-sm text-white truncate" title={member.email}>{member.email}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <Briefcase className="h-4 w-4 text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500 mb-1">Member Type</p>
                                <p className="text-sm text-white capitalize">{member.user_type || '—'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 col-span-2">
                                <GraduationCap className="h-4 w-4 text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500 mb-1">Onboarding Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {member.onboarding_completed ? (
                                        <span className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-lime/10 text-lime text-sm font-medium w-full">
                                            <CheckCircle2 className="h-4 w-4" /> Completed
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-sm font-medium w-full">
                                            <Clock className="h-4 w-4" /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Analytics & Readiness */}
                                <div>
                                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-lime" />
                                        Individual Analytics
                                    </h3>

                                    {!teamSub && !mgmtSub ? (
                                        <div className="bg-bg-elevated border border-border rounded-xl p-6 text-center">
                                            <Brain className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">No survey data linked to this email.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-bg-elevated border border-border rounded-xl p-5">
                                            {teamSub && (
                                                <>
                                                    <ScoreBar label="AI Confidence in Workflow" value={teamSub.q5_confidence_ai_workflow} />
                                                    <ScoreBar label="AI Skill Level" value={teamSub.q6_skill_level_ai_tools} />
                                                    <ScoreBar label="Overall Readiness" value={teamSub.q11_readiness} />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Assignments */}
                                <div>
                                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                        <Target className="h-4 w-4 text-lime" />
                                        Assignment Submissions
                                    </h3>

                                    {submissions.length === 0 ? (
                                        <div className="bg-bg-elevated border border-border rounded-xl p-6 text-center">
                                            <Target className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">No assignment submissions yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {submissions.map((sub: any) => (
                                                <div key={sub.id} className="bg-bg-elevated border border-border rounded-xl p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-sm font-medium text-white">{sub.assignment?.title || 'Unknown Assignment'}</h4>
                                                        <span className={`px-2 py-0.5 text-xs rounded-lg border ${sub.status === 'graded' ? 'bg-lime/10 text-lime border-lime/20' :
                                                            sub.status === 'submitted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                sub.status === 'needs_revision' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                                                                    'bg-white/5 text-gray-400 border-border'
                                                            }`}>
                                                            {sub.status === 'needs_revision' ? 'Needs Revision' :
                                                                sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                                                        </p>

                                                        {sub.status === 'graded' && sub.admin_feedback && (
                                                            <button className="text-xs text-lime hover:underline">
                                                                View Feedback
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
} 
