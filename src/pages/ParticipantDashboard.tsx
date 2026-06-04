import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    FileText,
    MessageSquare,
    CheckCircle2,
    Clock,
    ArrowRight,
    Sparkles,
    Play,
    X,
    Lock,
    CalendarCheck,
    GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Portal } from '@/components/shared/Portal'
import { VideoModal } from '@/components/shared/VideoModal'
import { supabase } from '@/lib/supabase'
import { formatDateLabel, formatRelativeTime, formatSessionDateTime } from '@/lib/time'
import { computeInitialScore, computeAssignmentBoost, computeFinalScore } from '@/lib/scoring'
import type { Assignment, ChatMessage, Cohort, Session, Submission, SurveyAnswers, UserType } from '@/types/database'

function extractVimeoId(urlOrId: string): string {
    const match = urlOrId.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : urlOrId.replace(/\D/g, '')
}

function formatDubaiTime(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return '7 p.m. Dubai time'
    
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Asia/Dubai'
    })
    
    const parts = formatter.formatToParts(date)
    const hour = parts.find(p => p.type === 'hour')?.value || '7'
    const minute = parts.find(p => p.type === 'minute')?.value || '00'
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'PM'
    
    const periodStr = dayPeriod.toLowerCase().replace('am', 'a.m.').replace('pm', 'p.m.')
    const timeStr = minute === '00' ? `${hour} ${periodStr}` : `${hour}:${minute} ${periodStr}`
    return `${timeStr} Dubai time`
}

interface CertificateModalProps {
    isOpen: boolean
    onClose: () => void
    userName: string
    companyName: string
    onClaim: () => Promise<void>
    isClaimed: boolean
}

function CertificateModal({
    isOpen,
    onClose,
    userName,
    companyName,
    onClaim,
    isClaimed,
}: CertificateModalProps) {
    const [claiming, setClaiming] = useState(false)
    if (!isOpen) return null

    const handleClaimClick = async () => {
        setClaiming(true)
        await onClaim()
        setClaiming(false)
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
                <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-bg-card border-2 border-lime/30 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8 overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }} />

                    <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-lime/10 blur-[80px] z-0 pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-lime/10 blur-[80px] z-0 pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <span className="text-[11px] font-bold tracking-[0.2em] text-lime uppercase">Zkandar AI Academy</span>
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Certificate of Completion</h2>
                            <div className="h-0.5 w-24 bg-lime mx-auto mt-4" />
                        </div>

                        <div className="space-y-4 py-4">
                            <p className="text-gray-400 text-sm italic">This is proudly presented to</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide font-heading">{userName}</h3>
                            {companyName && (
                                <p className="text-lime/90 font-medium text-sm tracking-wide uppercase">{companyName}</p>
                            )}
                            <div className="max-w-md mx-auto h-[1px] bg-white/10 my-4" />
                            <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
                                for successfully completing the intensive <span className="text-white font-semibold">Zkandar AI Sprint Workshop</span>, mastering advanced generative design workflows, AI tool adoption strategies, and collaborative team productivity frameworks.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                            <div className="text-left space-y-1">
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-medium text-white">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="font-serif italic text-lg text-lime tracking-wide">Khaled Zkandar</div>
                                <div className="h-[1px] w-32 bg-white/20 mx-auto" />
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Founder & Instructor</p>
                            </div>

                            <div className="text-right space-y-1">
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Credential ID</p>
                                <p className="text-xs font-mono text-gray-400">ZK-AI-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6 shrink-0">
                            {!isClaimed ? (
                                <button
                                    onClick={handleClaimClick}
                                    disabled={claiming}
                                    className="px-6 py-3 rounded-xl gradient-lime text-black font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-lime/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {claiming ? 'Claiming...' : 'Claim Certificate & Unlock 1-on-1'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        window.print()
                                    }}
                                    className="px-6 py-3 rounded-xl gradient-lime text-black font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-lime/10"
                                >
                                    Download PDF
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Portal>
    )
}

/** Mini Vimeo frame shown in the hero banner — fetches URL from platform_settings */
function WelcomeVideoMiniFrame({ userType }: { userType: UserType | null }) {
    const [vimeoId, setVimeoId] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const key = userType === 'management' ? 'welcome_video_management' : 'welcome_video_team'

    useEffect(() => {
        supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .single<{ value: string }>()
            .then(({ data, error }) => {
                if (!error && data?.value) {
                    setVimeoId(extractVimeoId(data.value))
                }
            })
    }, [key])

    if (!vimeoId) return null

    return (
        <>
            <div className="hidden lg:block shrink-0 w-56 xl:w-64 space-y-2">
                <div
                    className="relative rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/50"
                    style={{ aspectRatio: '16/9' }}
                >
                    <iframe
                        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0&portrait=0`}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        allow="autoplay; fullscreen"
                        title="Platform walkthrough preview"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center p-2 group">
                        <div
                            onClick={() => setIsFullscreen(true)}
                            className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 hover:scale-110 hover:border-lime/50 transition-all cursor-pointer z-20 group-hover:shadow-[0_0_30px_rgba(208,255,113,0.2)]"
                        >
                            <Play className="h-5 w-5 text-white ml-1 transition-colors group-hover:text-lime" />
                        </div>
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] text-center uppercase">PLATFORM WALKTHROUGH</p>
            </div>

            <AnimatePresence>
                {isFullscreen && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl"
                            onClick={() => setIsFullscreen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-black/50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <iframe
                                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0&title=0&byline=0&portrait=0`}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen"
                                />
                                <button
                                    onClick={() => setIsFullscreen(false)}
                                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transition-colors z-50 group hover:border-red-500/50"
                                >
                                    <X className="h-5 w-5 group-hover:text-red-400 transition-colors" />
                                </button>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    )
}

// ── Timeline item types ────────────────────────────────────────────────────────

type SprintTimelineItem =
    | { type: 'session'; id: string; title: string; date: string; scheduledDate: string;
        completed: boolean; current: boolean; isLiveOrSoon: boolean; recordingUrl: string | null; zoomLink: string | null }
    | { type: 'assignment'; id: string; title: string; dueDate: string;
        submitted: boolean; sessionCompleted: boolean; locked?: boolean; status?: string }


export function ParticipantDashboard() {
    const { user } = useAuth()
    const { effectiveUserId, isPreviewing, canPreview, previewUser } = useViewMode()
    const effectiveUserType = (canPreview && isPreviewing && previewUser)
        ? previewUser.user_type
        : user?.user_type ?? null
    const isSprintMember = effectiveUserType === 'sprint_member'

    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([])
    const [aiScore, setAiScore] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [bookingCompleted, setBookingCompleted] = useState(false)
    const [certificateClaimed, setCertificateClaimed] = useState(false)
    const [showCertificateModal, setShowCertificateModal] = useState(false)
    const [companyName, setCompanyName] = useState('')
    const [userName, setUserName] = useState('')
    const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null)
    const [showBookingDialog, setShowBookingDialog] = useState(false)
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
    const [countdown, setCountdown] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isLive?: boolean;
        sessionNumber?: number;
        sessionTitle?: string;
        dubaiTimeLabel?: string;
    } | null>(null)

    const firstName = user?.full_name?.split(' ')[0] || 'there'

    useEffect(() => {
        if (!effectiveUserId) {
            setLoading(false)
            return
        }

        let ignore = false

        const fetchDashboard = async () => {
            setLoading(true)
            setError(null)

            // ── 1. Get all cohort IDs accessible to this user ──────────────────
            // Via their company's cohort_id
            const [profileRes, membershipRes, calendlyRes] = await Promise.all([
                supabase
                    .from('users')
                    .select('full_name, company_id, ai_readiness_score, onboarding_data, user_type, sprint_booking_completed, profile_data')
                    .eq('id', effectiveUserId)
                    .single(),
                supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', effectiveUserId),
                supabase
                    .from('platform_settings')
                    .select('value')
                    .eq('key', 'sprint_booking_calendly_url')
                    .maybeSingle(),
            ])

            if (ignore) return

            const profileRow = profileRes.data as { full_name: string | null; company_id: string | null; ai_readiness_score: number; onboarding_data: Record<string, unknown> | null; user_type: string | null; sprint_booking_completed: boolean | null; profile_data: Record<string, any> | null } | null
            // Note: we do NOT set aiScore from the DB value here to avoid a visible flash.
            // The score is computed live below once all data is fetched.
            setBookingCompleted(profileRow?.sprint_booking_completed ?? false)
            setCertificateClaimed(!!profileRow?.profile_data?.certificate_claimed)
            setUserName(profileRow?.full_name || '')
            setCalendlyUrl((calendlyRes.data as { value: string } | null)?.value ?? null)
            const membershipIds = ((membershipRes.data as { cohort_id: string }[] | null) ?? []).map((m) => m.cohort_id)

            const cohortIdSet = new Set<string>(membershipIds)

            // Also check if the user's company has a cohort
            let compName = ''
            if (profileRow?.company_id) {
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('name, cohort_id')
                    .eq('id', profileRow.company_id)
                    .single()

                if (ignore) return

                const compRow = companyData as { name: string; cohort_id: string | null } | null
                if (compRow?.name) compName = compRow.name
                if (compRow?.cohort_id) cohortIdSet.add(compRow.cohort_id)
            }
            setCompanyName(compName)

            const cohortIds = Array.from(cohortIdSet)

            if (cohortIds.length === 0) {
                setSessions([])
                setAssignments([])
                setSubmissions([])
                setRecentMessages([])
                setCohorts([])
                setLoading(false)
                return
            }

            // ── 2. Fetch cohorts, sessions, and chats in parallel ──────────────
            const companyId = profileRow?.company_id

            // Fetch rooms linked to cohort or company first
            let userRoomIds: string[] = []
            if (cohortIds.length > 0 || companyId) {
                let roomQuery = supabase.from('chat_rooms').select('id')
                if (cohortIds.length > 0 && companyId) {
                    roomQuery = roomQuery.or(`cohort_id.in.(${cohortIds.join(',')}),company_id.eq.${companyId}`)
                } else if (cohortIds.length > 0) {
                    roomQuery = roomQuery.in('cohort_id', cohortIds)
                } else if (companyId) {
                    roomQuery = roomQuery.eq('company_id', companyId)
                }
                const { data: rooms } = await roomQuery
                if (rooms) {
                    userRoomIds = rooms.map(r => r.id)
                }
            }

            let chatQuery
            if (userRoomIds.length > 0) {
                chatQuery = supabase
                    .from('chat_messages')
                    .select('id, body, created_at, sender:users(full_name)')
                    .in('room_id', userRoomIds)
                    .order('created_at', { ascending: false })
                    .limit(4)
            } else {
                chatQuery = supabase
                    .from('chat_messages')
                    .select('id, body, created_at, sender:users(full_name)')
                    .eq('id', '00000000-0000-0000-0000-000000000000')
                    .limit(0)
            }

            const [cohortsRes, sessionsRes, chatRes] = await Promise.all([
                supabase.from('cohorts').select('*').in('id', cohortIds),
                supabase.from('sessions')
                    .select('id, title, scheduled_date, status, cohort_id, zoom_link, recording_url, session_number')
                    .in('cohort_id', cohortIds)
                    .order('scheduled_date', { ascending: true }),
                chatQuery
            ])

            if (ignore) return

            if (sessionsRes.error) {
                setError(sessionsRes.error.message)
                setLoading(false)
                return
            }

            setCohorts((cohortsRes.data as Cohort[]) ?? [])
            const sessionRows = (sessionsRes.data as Session[]) ?? []
            setSessions(sessionRows)
            setRecentMessages((chatRes.data as ChatMessage[]) ?? [])

            // ── 3. Fetch assignments (needs sessionIds) ───────────────────────
            const sessionIds = sessionRows.map((s) => s.id)
            if (sessionIds.length > 0) {
                const { data: assignmentsData } = await supabase
                    .from('assignments')
                    .select('id, title, due_date, session_id, submission_format, lock_override')
                    .in('session_id', sessionIds)
                    .order('due_date', { ascending: true })

                if (ignore) return
                const assignmentRows = (assignmentsData as Assignment[]) ?? []
                setAssignments(assignmentRows)

                // ── 4. Fetch submissions (needs assignmentIds) ────────────────
                if (assignmentRows.length > 0) {
                    const { data: submissionsData } = await supabase
                        .from('submissions')
                        .select('id, assignment_id, submitted_at, score, status')
                        .eq('user_id', effectiveUserId)
                        .in('assignment_id', assignmentRows.map((a) => a.id))

                    if (ignore) return
                    const subs = (submissionsData as (Submission & { score?: number })[]) ?? []
                    setSubmissions(subs)

                    // Live compute the exact AI readiness score using the same engine as My Performance
                    if (profileRow?.onboarding_data?.survey_answers) {
                        const answers = profileRow.onboarding_data.survey_answers as SurveyAnswers
                        const initialScore = computeInitialScore(answers, profileRow.user_type)
                        const gradedScores = subs.map(s => s.score).filter((s): s is number => typeof s === 'number')
                        const boost = computeAssignmentBoost(gradedScores)
                        const finalLiveScore = computeFinalScore(initialScore, boost)
                        setAiScore(finalLiveScore)
                    }
                } else if (profileRow?.onboarding_data?.survey_answers) {
                    const answers = profileRow.onboarding_data.survey_answers as SurveyAnswers
                    const initialScore = computeInitialScore(answers, profileRow.user_type)
                    setAiScore(computeFinalScore(initialScore, 0))
                }
            }

            if (!ignore) setLoading(false)
        }

        fetchDashboard()
        return () => { ignore = true }
    }, [effectiveUserId])

    // ── Countdown timer (sprint, team, and management members) ────────────────
    useEffect(() => {
        if (sessions.length === 0) { setCountdown(null); return }
        const tick = () => {
            const now = Date.now()
            
            // Check if there is an active/live session right now
            const live = sessions.find(s => {
                const scheduledAt = new Date(s.scheduled_date).getTime()
                return now >= scheduledAt && now <= scheduledAt + 4 * 60 * 60 * 1000 && !s.recording_url && s.status !== 'completed'
            })
            
            if (live) {
                setCountdown({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isLive: true,
                    sessionNumber: live.session_number,
                    sessionTitle: live.title
                })
                return
            }

            const nextSession = [...sessions]
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .find(s => new Date(s.scheduled_date).getTime() > now)

            if (!nextSession) { setCountdown(null); return }

            const diff = new Date(nextSession.scheduled_date).getTime() - now
            if (diff <= 0) { setCountdown(null); return }
            setCountdown({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
                sessionNumber: nextSession.session_number,
                sessionTitle: nextSession.title,
                dubaiTimeLabel: formatDubaiTime(nextSession.scheduled_date)
            })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [sessions])

    // ── Derived state ──────────────────────────────────────────────────────────
    const sessionTimeline = useMemo(() => {
        const now = Date.now()

        return sessions
            .slice()
            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
            .map((session) => {
                const scheduledAt = new Date(session.scheduled_date).getTime()
                const completed = session.status === 'completed' || !!session.recording_url || now > scheduledAt + 4 * 60 * 60 * 1000
                const isLiveOrSoon = now >= scheduledAt - 3 * 60 * 60 * 1000 && now <= scheduledAt + 4 * 60 * 60 * 1000
                const current = !completed && isLiveOrSoon
                return {
                    id: session.id,
                    title: session.title,
                    date: formatSessionDateTime(session.scheduled_date),
                    scheduledDate: session.scheduled_date,
                    completed,
                    current,
                    isLiveOrSoon,
                    zoomLink: session.zoom_link ?? null,
                    recordingUrl: session.recording_url ?? null,
                }
            })
    }, [sessions])

    const s1ReflectionSubmitted = useMemo(() => {
        const ass = assignments.find(a => a.title.toLowerCase().includes('session 1 reflection'))
        return ass ? submissions.some(s => s.assignment_id === ass.id) : false
    }, [assignments, submissions])

    const s2ReflectionSubmitted = useMemo(() => {
        const ass = assignments.find(a => a.title.toLowerCase().includes('session 2 reflection'))
        return ass ? submissions.some(s => s.assignment_id === ass.id) : false
    }, [assignments, submissions])

    const sprintAssignmentSubmission = useMemo(() => {
        const ass = assignments.find(a => a.title.toLowerCase().includes('sprint assignment') || a.title === 'AI ASSIGNMENT')
        return ass ? submissions.find(s => s.assignment_id === ass.id) : null
    }, [assignments, submissions])

    const sprintAssignmentApproved = useMemo(() => {
        return sprintAssignmentSubmission ? sprintAssignmentSubmission.status === 'approved' : false
    }, [sprintAssignmentSubmission])



    // ── Sprint interleaved timeline (sessions + assignments) ──────────────────
    const sprintTimeline = useMemo((): SprintTimelineItem[] => {
        if (!isSprintMember) return []
        const now = Date.now()
        const submissionIds = new Set(submissions.map(s => s.assignment_id))
        const result: SprintTimelineItem[] = []

        const sorted = [...sessions].sort((a, b) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )
        for (const session of sorted) {
            const scheduledAt = new Date(session.scheduled_date).getTime()
            const completed = session.status === 'completed' || !!session.recording_url || now > scheduledAt + 4 * 60 * 60 * 1000
            const isLiveOrSoon = now >= scheduledAt - 3 * 60 * 60 * 1000 && now <= scheduledAt + 4 * 60 * 60 * 1000
            const current = !completed && isLiveOrSoon

            result.push({
                type: 'session',
                id: session.id,
                title: session.title,
                date: formatSessionDateTime(session.scheduled_date),
                scheduledDate: session.scheduled_date,
                completed,
                current,
                isLiveOrSoon,
                zoomLink: session.zoom_link ?? null,
                recordingUrl: session.recording_url ?? null,
            })

            const sessionAssignments = assignments
                .filter(a => a.session_id === session.id)
                .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
            for (const a of sessionAssignments) {
                const titleLower = a.title.toLowerCase()
                let isLocked = false
                
                if (a.lock_override === 'unlocked') {
                    isLocked = false
                } else if (a.lock_override === 'locked') {
                    isLocked = true
                } else if (titleLower.includes('session 1 reflection')) {
                    // Unlocks after Session 1 ends
                    isLocked = !completed
                } else if (titleLower.includes('session 2 reflection') || titleLower.includes('session 2 implementation')) {
                    // Unlocks after Session 2 ends AND S1 reflection submitted
                    isLocked = !completed || !s1ReflectionSubmitted
                } else if (titleLower.includes('sprint assignment') || a.title === 'AI ASSIGNMENT') {
                    // Unlocks after Session 3 ends AND S2 reflection submitted
                    isLocked = !completed || !s2ReflectionSubmitted
                } else {
                    isLocked = scheduledAt > now
                }

                const sub = submissions.find(s => s.assignment_id === a.id)
                const isResubmit = sub ? sub.status === 'resubmit' : false

                result.push({
                    type: 'assignment',
                    id: a.id,
                    title: a.title,
                    dueDate: a.due_date ? formatDateLabel(a.due_date) : 'TBD',
                    submitted: submissionIds.has(a.id) && !isResubmit,
                    sessionCompleted: completed,
                    locked: isLocked,
                    status: sub?.status
                })
            }
        }
        return result
    }, [isSprintMember, sessions, assignments, submissions, s1ReflectionSubmitted, s2ReflectionSubmitted])

    const totalSessions = sessions.length
    const completedSessions = useMemo(() => {
        const now = Date.now()
        return sessions.filter((s) => s.status === 'completed' || new Date(s.scheduled_date).getTime() < now).length
    }, [sessions])

    const assignmentSummary = useMemo(() => {
        const submissionIds = new Set(submissions.map((s) => s.assignment_id))
        const now = Date.now()
        const sessionDateMap = new Map(sessions.map(s => [s.id, new Date(s.scheduled_date).getTime()]))

        const items = assignments
            .map((a) => {
                const submitted = submissionIds.has(a.id)
                const dueDate = a.due_date ? new Date(a.due_date).getTime() : null
                const isOverdue = dueDate ? dueDate < now : false
                const sessionStartTime = sessionDateMap.get(a.session_id) ?? 0
                const isLocked = sessionStartTime > now

                const status: 'pending' | 'upcoming' | 'submitted' | 'locked' = isLocked
                    ? 'locked'
                    : submitted
                        ? 'submitted'
                        : isOverdue
                            ? 'pending'
                            : 'upcoming'

                return { id: a.id, title: a.title, dueDate: a.due_date ? formatDateLabel(a.due_date) : 'TBD', status, dueSort: dueDate ?? Number.MAX_SAFE_INTEGER }
            })
            .sort((a, b) => {
                const order = { pending: 0, upcoming: 1, submitted: 2, locked: 3 }
                if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
                return a.dueSort - b.dueSort
            })
            .slice(0, 3)

        return { total: assignments.length, completed: submissionIds.size, items }
    }, [assignments, submissions, sessions])

    const chatPreview = useMemo(() => recentMessages.map((m) => ({
        id: m.id,
        sender: m.sender?.full_name ?? 'Member',
        message: m.body ?? '',
        time: formatRelativeTime(m.created_at),
    })), [recentMessages])

    const primaryCohort = cohorts[0]
    const isSprintWorkshop = primaryCohort?.offering_type === 'sprint_workshop'

    const handleClaimCertificate = async () => {
        if (!effectiveUserId) return
        try {
            const { data: userData } = await (supabase
                .from('users' as any) as any)
                .select('profile_data')
                .eq('id', effectiveUserId)
                .single()
            
            const currentProfile = (userData?.profile_data as Record<string, any>) || {}
            const newProfile = {
                ...currentProfile,
                certificate_claimed: true,
                certificate_claimed_at: new Date().toISOString()
            }
            
            await (supabase
                .from('users' as any) as any)
                .update({ profile_data: newProfile })
                .eq('id', effectiveUserId)
            
            setCertificateClaimed(true)
        } catch (err) {
            console.error('Failed to claim certificate:', err)
        }
    }

    const handleHaveBooked = async () => {
        if (!effectiveUserId) return
        const { error: bookErr } = await supabase
            .from('users')
            // @ts-expect-error - column added in migration, types not regenerated
            .update({ sprint_booking_completed: true })
            .eq('id', effectiveUserId)
        if (!bookErr) {
            setBookingCompleted(true)
            setShowBookingDialog(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card to-bg-elevated border border-border p-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-center gap-8">
                    {/* Left: text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-lime" />
                            <span className="text-xs uppercase tracking-widest text-lime">
                                {isSprintWorkshop ? 'Sprint Workshop' : 'Master Class Journey'}
                            </span>
                        </div>
                        <h1 className="hero-text text-3xl md:text-4xl mb-4">
                            Hey <span className="text-gradient">{firstName}</span>, here's your progress
                        </h1>
                        <p className="text-gray-400 max-w-lg">
                            {isSprintWorkshop
                                ? "Welcome to your sprint! Follow the sessions below and engage with your program to maximize your learning."
                                : "You're making great progress! Keep up the momentum and complete your assignments to earn your certificate."}
                        </p>

                        {/* Countdown timer — shows until next session starts */}
                        {countdown && (
                            countdown.isLive ? (
                                <div className="mt-5 inline-flex items-center gap-2 bg-lime/10 border border-lime/20 rounded-xl px-4 py-2.5 text-lime shrink-0">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-duration-1000"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-lime"></span>
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-[0.05em]">
                                        Session {countdown.sessionNumber} is Live Now! Join the Zoom meeting below.
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-5 flex items-center gap-3 flex-wrap">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0">
                                        {countdown.sessionNumber 
                                            ? `Session ${countdown.sessionNumber} starts in` 
                                            : 'Next upcoming session starts in'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {[
                                            { v: countdown.days, label: 'd' },
                                            { v: countdown.hours, label: 'h' },
                                            { v: countdown.minutes, label: 'm' },
                                            { v: countdown.seconds, label: 's' },
                                        ].map(({ v, label }) => (
                                            <div key={label} className="flex flex-col items-center">
                                                <span className="w-10 h-9 flex items-center justify-center bg-lime/10 border border-lime/20 rounded-lg text-lime font-mono font-bold text-sm tabular-nums">
                                                    {String(v).padStart(2, '0')}
                                                </span>
                                                <span className="text-[9px] text-gray-600 mt-0.5 uppercase tracking-wider">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {countdown.dubaiTimeLabel && (
                                        <span className="text-sm font-semibold text-lime ml-0.5">
                                            {countdown.dubaiTimeLabel}
                                        </span>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    {/* Right: Welcome video mini-frame */}
                    <WelcomeVideoMiniFrame userType={user?.user_type ?? null} />
                </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`grid grid-cols-1 gap-4 ${isSprintMember ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}
            >
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{completedSessions}/{totalSessions}</p>
                            <p className="text-xs text-gray-500">Sessions Attended</p>
                        </div>
                    </div>
                    <ProgressBar current={completedSessions} total={totalSessions || 1} />
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{assignmentSummary.completed}/{assignmentSummary.total}</p>
                            <p className="text-xs text-gray-500">Assignments Done</p>
                        </div>
                    </div>
                    <ProgressBar current={assignmentSummary.completed} total={assignmentSummary.total || 1} />
                </div>
                {!isSprintMember && (
                    <div className="bg-bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-lime" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {aiScore === null ? <span className="inline-block w-12 h-7 bg-white/10 rounded animate-pulse" /> : `${aiScore}%`}
                                </p>
                                <p className="text-xs text-gray-500">AI Readiness Score</p>
                            </div>
                        </div>
                        <ProgressBar current={aiScore ?? 0} total={100} />
                    </div>
                )}
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`${isSprintMember ? 'lg:col-span-3' : 'lg:col-span-2'} bg-bg-card border border-border rounded-2xl p-6`}
                >
                    <h2 className="font-heading text-lg font-bold mb-6">
                        {isSprintMember ? 'Your Sprint Journey' : 'Session Timeline'}
                    </h2>
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-10 w-10 rounded-lg bg-white/5 shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-white/5 rounded w-1/3" />
                                        <div className="h-3 bg-white/5 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-400">{error}</div>
                    ) : sessionTimeline.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No sessions yet.</div>
                    ) : (
                        <div className="space-y-0">
                            {isSprintMember ? (
                                // ── Sprint: interleaved sessions + assignments ────────────
                                sprintTimeline.map((item) => {
                                    // Sprint always has booking milestone after, so always draw connector
                                    return (
                                        <div key={item.type + item.id} className="relative group">
                                            {/* Connector line — always drawn; booking milestone follows */}
                                            <div className="absolute left-[35px] top-[48px] bottom-[-8px] w-px bg-border z-0" />

                                            {item.type === 'session' ? (
                                                <div className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors border ${
                                                    item.current ? 'bg-lime/5 border-lime/20' : 'hover:bg-white/5 border-transparent'
                                                }`}>
                                                    <div className="flex flex-col items-center shrink-0 w-10">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                            item.completed ? 'bg-lime/10' : item.current ? 'gradient-lime shadow-lg shadow-lime/20' : 'bg-white/5'
                                                        }`}>
                                                            {item.completed ? (
                                                                <CheckCircle2 className="h-5 w-5 text-lime" />
                                                            ) : item.current ? (
                                                                <Play className="h-5 w-5 text-black ml-0.5" />
                                                            ) : (
                                                                <Clock className="h-5 w-5 text-gray-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <p className={`font-medium truncate ${item.completed ? 'text-gray-400' : item.current ? 'text-lime' : 'text-white'}`}>
                                                                    {item.title}
                                                                </p>
                                                                <p className={`text-xs mt-0.5 ${item.current ? 'text-lime/70' : 'text-gray-500'}`}>{item.date}</p>
                                                            </div>
                                                            {item.completed ? (
                                                                item.recordingUrl && (
                                                                    <button
                                                                        onClick={() => setActiveVideoUrl(item.recordingUrl)}
                                                                        className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                                    >
                                                                        Watch Now
                                                                    </button>
                                                                )
                                                            ) : (
                                                                item.zoomLink ? (
                                                                    item.isLiveOrSoon ? (
                                                                        <button
                                                                            onClick={() => window.open(item.zoomLink!, '_blank')}
                                                                            className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                                        >
                                                                            Join Now
                                                                        </button>
                                                                    ) : (
                                                                        <span className="px-4 py-2 text-sm text-gray-500 border border-white/[0.06] rounded-lg shrink-0 font-medium bg-white/[0.02]">
                                                                            Coming Up
                                                                        </span>
                                                                    )
                                                                ) : item.current ? (
                                                                    <span className="px-4 py-2 text-sm text-gray-600 border border-white/[0.06] rounded-lg shrink-0">Coming Up</span>
                                                                ) : null
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Assignment row
                                                <div className="relative flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/[0.03] border border-transparent transition-colors">
                                                    <div className="flex flex-col items-center shrink-0 w-10">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center relative z-10 ${
                                                            item.submitted 
                                                                ? (item.status === 'approved' || item.status === 'reviewed') 
                                                                    ? 'bg-lime/10' 
                                                                    : item.status === 'resubmit' 
                                                                        ? 'bg-orange-500/10' 
                                                                        : 'bg-yellow-500/10'
                                                                : item.locked 
                                                                    ? 'bg-red-500/10' 
                                                                    : 'bg-lime/5 border border-lime/20'
                                                        }`}>
                                                            {item.submitted ? (
                                                                (item.status === 'approved' || item.status === 'reviewed') ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-lime" />
                                                                ) : item.status === 'resubmit' ? (
                                                                    <X className="h-4 w-4 text-orange-400" />
                                                                ) : (
                                                                    <Clock className="h-4 w-4 text-yellow-400" />
                                                                )
                                                            ) : item.locked ? (
                                                                <Lock className="h-4 w-4 text-red-400" />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-lime" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm truncate ${item.submitted ? 'text-gray-400' : 'text-white/80'}`}>{item.title}</p>
                                                        <p className="text-xs text-gray-600 mt-0.5">Due: {item.dueDate}</p>
                                                    </div>
                                                    {item.submitted ? (
                                                        (item.status === 'approved' || item.status === 'reviewed') ? (
                                                            <span className="px-2 py-1 text-xs bg-lime/10 text-lime border border-lime/20 rounded-lg shrink-0">Approved</span>
                                                        ) : item.status === 'resubmit' ? (
                                                            <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg shrink-0">Resubmit</span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-lg shrink-0">In Review</span>
                                                        )
                                                    ) : item.locked ? (
                                                        <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg shrink-0 flex items-center gap-1">
                                                            <Lock className="h-3 w-3" /> Locked
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs bg-lime/10 text-lime border border-lime/20 rounded-lg shrink-0">Available</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="h-1.5" />
                                        </div>
                                    )
                                })
                            ) : (
                                // ── Master Class: sessions only ──────────────────────────
                                sessionTimeline.map((session, idx) => {
                                    const isLast = idx === sessionTimeline.length - 1
                                    return (
                                        <div key={session.id} className="relative group">
                                            {!isLast && (
                                                <div className="absolute left-[35px] top-[56px] bottom-[-16px] w-px bg-border z-0" />
                                            )}
                                            <div className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors ${
                                                session.current ? 'bg-lime/5 border border-lime/20' : 'hover:bg-white/5 border border-transparent'
                                            }`}>
                                                <div className="flex flex-col items-center shrink-0 w-10">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                        session.completed ? 'bg-lime/10' : session.current ? 'gradient-lime shadow-lg shadow-lime/20' : 'bg-white/5'
                                                    }`}>
                                                        {session.completed ? (
                                                            <CheckCircle2 className="h-5 w-5 text-lime" />
                                                        ) : session.current ? (
                                                            <Play className="h-5 w-5 text-black ml-0.5" />
                                                        ) : (
                                                            <Clock className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className={`font-medium truncate ${session.completed ? 'text-gray-400' : 'text-white'} ${session.current ? 'text-lime' : ''}`}>
                                                                {session.title}
                                                            </p>
                                                            <p className={`text-xs mt-0.5 truncate ${session.current ? 'text-lime/70' : 'text-gray-500'}`}>{session.date}</p>
                                                        </div>
                                                        {session.completed ? (
                                                            session.recordingUrl && (
                                                                <button
                                                                    onClick={() => setActiveVideoUrl(session.recordingUrl)}
                                                                    className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                                >
                                                                    Watch Now
                                                                </button>
                                                            )
                                                        ) : (
                                                            session.zoomLink ? (
                                                                session.isLiveOrSoon ? (
                                                                    <button
                                                                        onClick={() => window.open(session.zoomLink!, '_blank')}
                                                                        className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                                    >
                                                                        Join Now
                                                                    </button>
                                                                ) : (
                                                                    <span className="px-4 py-2 text-sm text-gray-500 border border-white/[0.06] rounded-lg shrink-0 font-medium bg-white/[0.02]">
                                                                        Coming Up
                                                                    </span>
                                                                )
                                                            ) : session.current ? (
                                                                <span className="px-4 py-2 text-sm text-gray-600 border border-white/[0.06] rounded-lg shrink-0">Coming Up</span>
                                                            ) : null
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isLast && <div className="h-2" />}
                                        </div>
                                    )
                                })
                            )}

                            {/* Certificate milestone — sprint members only */}
                            {isSprintMember && (
                                <div className="relative group">
                                    <div className="absolute left-[35px] top-[48px] bottom-[-8px] w-px bg-border z-0" />
                                    
                                    <div className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors border ${
                                        certificateClaimed
                                            ? 'hover:bg-white/5 border-transparent'
                                            : sprintAssignmentApproved
                                            ? 'bg-lime/5 border border-lime/20'
                                            : 'opacity-40 border border-transparent'
                                    }`}>
                                        <div className="flex flex-col items-center shrink-0 w-10">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                certificateClaimed ? 'bg-lime/10' : sprintAssignmentApproved ? 'gradient-lime shadow-lg shadow-lime/20' : 'bg-white/5'
                                            }`}>
                                                {certificateClaimed ? (
                                                    <CheckCircle2 className="h-5 w-5 text-lime" />
                                                ) : sprintAssignmentApproved ? (
                                                    <GraduationCap className="h-5 w-5 text-black" />
                                                ) : (
                                                    <Lock className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className={`font-medium truncate ${certificateClaimed ? 'text-gray-400' : sprintAssignmentApproved ? 'text-lime' : 'text-gray-600'}`}>
                                                        AI Certificate of Completion
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${certificateClaimed ? 'text-gray-600' : sprintAssignmentApproved ? 'text-lime/70' : 'text-gray-600'}`}>
                                                        {certificateClaimed ? 'Certificate claimed!' : sprintAssignmentApproved ? 'Claim your personalized certificate' : 'Unlocks after Sprint Assignment is approved'}
                                                    </p>
                                                </div>
                                                {sprintAssignmentApproved && !certificateClaimed && (
                                                    <button
                                                        onClick={() => setShowCertificateModal(true)}
                                                        className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                    >
                                                        Claim Certificate
                                                    </button>
                                                )}
                                                {certificateClaimed && (
                                                    <button
                                                        onClick={() => setShowCertificateModal(true)}
                                                        className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg shrink-0 transition-all border border-border"
                                                    >
                                                        View Certificate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1.5" />
                                </div>
                            )}

                            {/* Booking milestone — sprint members only */}
                            {isSprintMember && (
                                <div className="relative group">
                                    <div className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors border ${
                                        bookingCompleted
                                            ? 'hover:bg-white/5 border-transparent'
                                            : sprintAssignmentApproved
                                            ? 'bg-lime/5 border border-lime/20'
                                            : 'opacity-40 border border-transparent'
                                    }`}>
                                        <div className="flex flex-col items-center shrink-0 w-10">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                bookingCompleted ? 'bg-lime/10' : sprintAssignmentApproved ? 'gradient-lime shadow-lg shadow-lime/20' : 'bg-white/5'
                                            }`}>
                                                {bookingCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-lime" />
                                                ) : sprintAssignmentApproved ? (
                                                    <CalendarCheck className="h-5 w-5 text-black" />
                                                ) : (
                                                    <Lock className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className={`font-medium truncate ${bookingCompleted ? 'text-gray-400' : sprintAssignmentApproved ? 'text-lime' : 'text-gray-600'}`}>
                                                        Book Your 1-on-1
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${bookingCompleted ? 'text-gray-600' : sprintAssignmentApproved ? 'text-lime/70' : 'text-gray-600'}`}>
                                                        {bookingCompleted ? 'Booked!' : sprintAssignmentApproved ? 'Schedule a call with Khaled' : 'Unlocks after Sprint Assignment is approved'}
                                                    </p>
                                                </div>
                                                {sprintAssignmentApproved && !bookingCompleted && (
                                                    <button
                                                        onClick={() => setShowBookingDialog(true)}
                                                        className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                    >
                                                        Book Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Right Column — hidden for sprint members */}
                {!isSprintMember && <div className="space-y-6">
                    {/* Upcoming Assignments */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-bg-card border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-heading text-lg font-bold">Assignments</h2>
                            <Link to="/my-program" className="text-sm text-lime hover:underline">View all</Link>
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse flex justify-between h-20" />
                                ))}
                            </div>
                        ) : assignmentSummary.items.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No assignments yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {assignmentSummary.items.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="p-4 rounded-xl bg-white/5 hover:bg-lime/5 transition"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-sm">{assignment.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</p>
                                            </div>
                                            {assignment.status === 'pending' && (
                                                <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg">Pending</span>
                                            )}
                                            {assignment.status === 'upcoming' && (
                                                <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-400 rounded-lg">Upcoming</span>
                                            )}
                                            {assignment.status === 'submitted' && (
                                                <span className="px-2 py-1 text-xs bg-lime/10 text-lime rounded-lg">Submitted</span>
                                            )}
                                            {assignment.status === 'locked' && (
                                                <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg flex items-center gap-1">
                                                    <Lock className="h-3 w-3" /> Locked
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Chat */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-bg-card border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-heading text-lg font-bold">Chat</h2>
                            <MessageSquare className="h-5 w-5 text-gray-500" />
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-3 rounded-xl bg-white/5 animate-pulse h-16" />
                                ))}
                            </div>
                        ) : chatPreview.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No recent messages.</div>
                        ) : (
                            <div className="space-y-3">
                                {chatPreview.map((msg) => (
                                    <div key={msg.id} className="p-3 rounded-xl bg-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium">{msg.sender}</p>
                                            <p className="text-xs text-gray-500">{msg.time}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{msg.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            to="/chat"
                            className="w-full mt-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition flex items-center justify-center gap-2"
                        >
                            Open Chat <ArrowRight className="h-3 w-3" />
                        </Link>
                    </motion.div>
                </div>}
            </div>

            {/* Booking Dialog */}
            <AnimatePresence>
                {showBookingDialog && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl"
                            onClick={() => setShowBookingDialog(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col"
                                style={{ maxHeight: '90vh' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                                    <div>
                                        <h2 className="font-heading text-lg font-bold text-white">Book Your 1-on-1 Call</h2>
                                        <p className="text-xs text-gray-500">Schedule your call with Khaled</p>
                                    </div>
                                    <button
                                        onClick={() => setShowBookingDialog(false)}
                                        className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Calendly embed */}
                                <div className="flex-1 min-h-0" style={{ height: '560px' }}>
                                    {calendlyUrl ? (
                                        <iframe
                                            src={calendlyUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none' }}
                                            title="Book a call with Khaled"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm px-8 text-center">
                                            Booking link not yet configured. Please contact your program admin.
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
                                    <button
                                        onClick={() => setShowBookingDialog(false)}
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        I'll book later
                                    </button>
                                    <button
                                        onClick={handleHaveBooked}
                                        className="flex items-center gap-2 px-5 py-2.5 gradient-lime text-black text-sm font-bold rounded-xl hover:opacity-90 transition"
                                    >
                                        <CalendarCheck className="h-4 w-4" />
                                        I have booked
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
                <CertificateModal
                    isOpen={showCertificateModal}
                    onClose={() => setShowCertificateModal(false)}
                    userName={userName || user?.full_name || 'Participant'}
                    companyName={companyName}
                    onClaim={handleClaimCertificate}
                    isClaimed={certificateClaimed}
                />
                <VideoModal
                    isOpen={!!activeVideoUrl}
                    videoUrl={activeVideoUrl || ''}
                    onClose={() => setActiveVideoUrl(null)}
                />
            </AnimatePresence>
        </div>
    )
}
