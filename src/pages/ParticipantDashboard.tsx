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
    Trophy,
    Play,
    X,
    Lock,
    CalendarCheck,
    GraduationCap,
    Zap,
    Crown,
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
import toast from 'react-hot-toast'
import { SprintCard } from '@/components/public/SprintCard'

function extractVimeoId(urlOrId: string): string {
    const match = urlOrId.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : urlOrId.replace(/\D/g, '')
}

function formatDubaiTime(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return '7 P.M. DUBAI TIME'
    
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
    
    const periodStr = dayPeriod.toUpperCase().replace('AM', 'A.M.').replace('PM', 'P.M.')
    const timeStr = minute === '00' ? `${hour} ${periodStr}` : `${hour}:${minute} ${periodStr}`
    return `${timeStr} DUBAI TIME`
}

interface CertificateModalProps {
    isOpen: boolean
    onClose: () => void
    userName: string
    companyName: string
    onClaim: () => Promise<void>
    isClaimed: boolean
    isWebinarMember?: boolean
}

function CertificateModal({
    isOpen,
    onClose,
    userName,
    companyName,
    onClaim,
    isClaimed,
    isWebinarMember,
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
                                for successfully completing the intensive <span className="text-white font-semibold">{isWebinarMember ? 'Beyond the AI Prompt Webinar' : 'Zkandar AI Sprint Workshop'}</span>, mastering advanced generative design workflows, AI tool adoption strategies, and collaborative team productivity frameworks.
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
                                    {claiming ? 'Claiming...' : (isWebinarMember ? 'Claim Certificate' : 'Claim Certificate & Unlock 1-on-1')}
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
    const isWebinarMember = effectiveUserType === 'webinar_member'

    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [userProfileData, setUserProfileData] = useState<Record<string, any> | null>(null)
    const [upgradingToGold, setUpgradingToGold] = useState(false)
    const [sprintDates, setSprintDates] = useState('June 3–5')
    const [sprintLocation, setSprintLocation] = useState('Live Zoom')
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
    const [showSprintBanner, setShowSprintBanner] = useState(false)
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

    const isGoldWebinarMember = isWebinarMember && userProfileData?.upgrade_tier === 'gold'

    const handleGoldUpgrade = async () => {
        if (!user?.email) {
            toast.error('Unable to verify user email.')
            return
        }
        
        setUpgradingToGold(true)
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const res = await fetch(`${supabaseUrl}/functions/v1/confirm-upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    tierId: 'gold',
                    price: 149,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to complete one-click upgrade.');
            }

            toast.success('Successfully upgraded to Gold Tier! Your premium dashboard is unlocked.');
            
            setUserProfileData(prev => ({
                ...(prev ?? {}),
                upgrade_tier: 'gold'
            }));
        } catch (err: any) {
            console.error('Gold upgrade error:', err);
            toast.error(err.message || 'Upgrade failed. Please try again.');
        } finally {
            setUpgradingToGold(false);
        }
    }

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
            setUserProfileData(profileRow?.profile_data || {})
            setCalendlyUrl((calendlyRes.data as { value: string } | null)?.value ?? null)

            // Fetch marketing settings from Supabase CMS (for the Sprint Card upgrade)
            supabase
                .from('platform_settings')
                .select('key, value')
                .in('key', ['marketing_sprint_dates', 'marketing_sprint_location'])
                .then(({ data }) => {
                    if (!data) return
                    const map: Record<string, string> = {}
                    data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
                    if (map.marketing_sprint_dates) setSprintDates(map.marketing_sprint_dates)
                    if (map.marketing_sprint_location !== undefined) setSprintLocation(map.marketing_sprint_location)
                })
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

    useEffect(() => {
        if (!isWebinarMember) return
        
        const dismissed = localStorage.getItem('zkandar_sprint_banner_dismissed')
        if (dismissed === 'true') return

        const timer = setTimeout(() => {
            setShowSprintBanner(true)
        }, 2500)

        return () => clearTimeout(timer)
    }, [isWebinarMember])

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
        <div className={`space-y-8 animate-fade-in relative ${isGoldWebinarMember ? 'gold-theme' : ''}`}>
            {/* Ambient gold glow for premium members */}
            {isGoldWebinarMember && (
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-radial from-amber-500/[0.08] to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
            )}

            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card to-bg-elevated border p-8 ${
                    isGoldWebinarMember ? 'border-amber-500/35 shadow-[0_0_40px_rgba(245,158,11,0.08)]' : 'border-border'
                }`}
            >
                {isGoldWebinarMember ? (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
                ) : (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl" />
                )}
                <div className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none rounded-2xl" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }} />
                <div className="relative z-10 flex items-center gap-8">
                    {/* Left: text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                            {isGoldWebinarMember ? (
                                <Crown className="h-5 w-5 text-amber-400 animate-pulse" />
                            ) : (
                                <Zap className="h-5 w-5 text-lime" />
                            )}
                            <span className={`text-[10px] font-bold tracking-widest font-heading ${isGoldWebinarMember ? 'text-amber-400' : 'text-lime'}`}>
                                {isGoldWebinarMember ? 'GOLD PREMIUM PASS' : isWebinarMember ? 'SILVER WEBINAR TICKET' : isSprintWorkshop ? 'SPRINT WORKSHOP' : 'MASTER CLASS JOURNEY'}
                            </span>
                        </div>
                        <h1 className="hero-text text-3xl md:text-4xl mb-4 font-heading font-black tracking-tight leading-none">
                            HEY <span className={isGoldWebinarMember ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-black font-heading' : 'text-gradient'}>{firstName.toUpperCase()}</span>, {isWebinarMember ? "HERE'S YOUR WEBINAR OVERVIEW" : "HERE'S YOUR PROGRESS"}
                        </h1>
                        <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wide max-w-lg">
                            {isWebinarMember
                                ? `WELCOME TO THE ZKANDAR AI WEBINAR! ${isGoldWebinarMember ? 'YOU HAVE PREMIUM GOLD ACCESS. ENJOY LIFETIME RECORDINGS AND PDF SLIDES.' : 'ACCESS YOUR LIVE STREAM AND RESOURCES BELOW.'}`
                                : isSprintWorkshop
                                ? "WELCOME TO YOUR SPRINT! FOLLOW THE SESSIONS BELOW AND ENGAGE WITH YOUR PROGRAM TO MAXIMIZE YOUR LEARNING."
                                : "YOU'RE MAKING GREAT PROGRESS! KEEP UP THE MOMENTUM AND COMPLETE YOUR ASSIGNMENTS TO EARN YOUR CERTIFICATE."}
                        </p>

                        {/* Countdown timer — shows until next session starts */}
                        {countdown && (
                            countdown.isLive ? (
                                <div className={`mt-5 inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 shrink-0 ${
                                    isGoldWebinarMember 
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                        : 'bg-lime/10 border-lime/20 text-lime'
                                }`}>
                                    <span className="relative flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 animate-duration-1000 ${
                                            isGoldWebinarMember ? 'bg-amber-400' : 'bg-lime'
                                        }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                            isGoldWebinarMember ? 'bg-amber-400' : 'bg-lime'
                                        }`}></span>
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-[0.05em] font-heading font-black">
                                        {isWebinarMember
                                            ? `WEBINAR DAY ${countdown.sessionNumber} IS LIVE NOW! JOIN THE ZOOM MEETING BELOW.`
                                            : `SESSION ${countdown.sessionNumber} IS LIVE NOW! JOIN THE ZOOM MEETING BELOW.`}
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-5 flex items-center gap-3 flex-wrap">
                                    <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase shrink-0 font-heading">
                                        {isWebinarMember
                                            ? `WEBINAR DAY ${countdown.sessionNumber} STARTS IN`
                                            : countdown.sessionNumber 
                                            ? `SESSION ${countdown.sessionNumber} STARTS IN` 
                                            : 'NEXT UPCOMING SESSION STARTS IN'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {[
                                            { v: countdown.days, label: 'D' },
                                            { v: countdown.hours, label: 'H' },
                                            { v: countdown.minutes, label: 'M' },
                                            { v: countdown.seconds, label: 'S' },
                                        ].map(({ v, label }) => (
                                            <div key={label} className="flex flex-col items-center">
                                                <span className={`w-10 h-9 flex items-center justify-center border rounded-lg font-mono font-bold text-sm tabular-nums ${
                                                    isGoldWebinarMember 
                                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                        : 'bg-lime/10 border-lime/20 text-lime'
                                                }`}>
                                                    {String(v).padStart(2, '0')}
                                                </span>
                                                <span className="text-[9px] text-gray-600 mt-0.5 uppercase tracking-wider">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {countdown.dubaiTimeLabel && (
                                        <span className={`text-sm font-semibold ml-0.5 ${
                                            isGoldWebinarMember ? 'text-amber-400' : 'text-lime'
                                        }`}>
                                            {countdown.dubaiTimeLabel}
                                        </span>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    {/* Right: Welcome video mini-frame */}
                    {!isWebinarMember && <WelcomeVideoMiniFrame userType={user?.user_type ?? null} />}
                </div>
            </motion.div>

            {/* Progress Overview */}
            {!isWebinarMember && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`grid grid-cols-1 gap-4 ${
                        isSprintMember
                            ? (assignmentSummary.total > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-sm')
                            : 'md:grid-cols-3'
                    }`}
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
                    {assignmentSummary.total > 0 && (
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
                    )}
                    {!isSprintMember && (
                        <div className="bg-bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-lime" />
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
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Session Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`${isSprintMember ? 'lg:col-span-3' : 'lg:col-span-2'} bg-bg-card rounded-2xl p-6 border relative overflow-hidden ${
                        isGoldWebinarMember ? 'border-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.04)]' : 'border-border'
                    }`}
                >
                    <div className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none rounded-2xl" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }} />
                    <div className="relative z-10">
                        <h2 className={`font-heading text-lg font-bold mb-6 uppercase tracking-wider ${isGoldWebinarMember ? 'text-amber-400' : ''}`}>
                            {isSprintMember ? 'YOUR SPRINT JOURNEY' : isWebinarMember ? 'WEBINAR SCHEDULE' : 'SESSION TIMELINE'}
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
                                // ── Master Class / Webinar: sessions only ──────────────────────────
                                sessionTimeline.map((session, idx) => {
                                    const isLast = idx === sessionTimeline.length - 1 && !isWebinarMember
                                    
                                    const cleanSessionTitle = isWebinarMember
                                        ? session.title.replace(/session\s*\d+\s*:?\s*/gi, '')
                                        : session.title
                                    
                                    const titleText = isWebinarMember
                                        ? `WEBINAR DAY ${idx + 1}: ${cleanSessionTitle.toUpperCase()}`
                                        : session.title.toUpperCase()

                                    return (
                                        <div key={session.id} className="relative group">
                                            {!isLast && (
                                                <div className={`absolute left-[35px] top-[60px] bottom-[-20px] w-px z-0 ${isGoldWebinarMember ? 'bg-amber-500/20' : 'bg-lime/20'}`} />
                                            )}
                                            <div className={`relative flex items-center gap-5 p-5 rounded-2xl border transition-all ${
                                                session.current 
                                                    ? (isGoldWebinarMember 
                                                        ? 'bg-amber-500/[0.03] border-amber-500/35 shadow-[0_0_30px_rgba(245,158,11,0.08)]' 
                                                        : 'bg-lime/[0.03] border-lime/35 shadow-[0_0_30px_rgba(208,255,113,0.08)]')
                                                    : session.completed
                                                    ? (isGoldWebinarMember 
                                                        ? 'bg-black/25 border-amber-500/10 hover:border-amber-500/20' 
                                                        : 'bg-black/25 border-lime/10 hover:border-lime/20')
                                                    : 'bg-black/25 border-white/[0.04] hover:border-white/[0.08]'
                                            }`}>
                                                <div className="absolute inset-0 opacity-[0.01] z-0 pointer-events-none rounded-2xl" style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                                }} />
                                                <div className="flex flex-col items-center shrink-0 w-10 relative z-10">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                        session.completed 
                                                            ? (isGoldWebinarMember ? 'bg-amber-500/10' : 'bg-lime/10')
                                                            : session.current 
                                                            ? (isGoldWebinarMember ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 text-black' : 'gradient-lime shadow-lg shadow-lime/20 text-black')
                                                            : 'bg-white/5'
                                                    }`}>
                                                        {session.completed ? (
                                                            <CheckCircle2 className={`h-5 w-5 ${isGoldWebinarMember ? 'text-amber-400' : 'text-lime'}`} />
                                                        ) : session.current ? (
                                                            <Play className="h-5 w-5 text-black ml-0.5" />
                                                        ) : (
                                                            <Clock className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className={`font-heading font-bold text-sm uppercase tracking-wide truncate ${session.completed ? 'text-gray-400' : 'text-white'} ${session.current ? (isGoldWebinarMember ? 'text-amber-400' : 'text-lime') : ''}`}>
                                                                {titleText}
                                                            </p>
                                                            <p className={`text-xs mt-0.5 uppercase tracking-wider truncate ${session.current ? (isGoldWebinarMember ? 'text-amber-400/70' : 'text-lime/70') : 'text-gray-500'}`}>{session.date.toUpperCase()}</p>
                                                        </div>
                                                        {session.completed ? (
                                                            session.recordingUrl && (
                                                                <button
                                                                    onClick={() => setActiveVideoUrl(session.recordingUrl)}
                                                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shrink-0 hover:scale-105 transition-transform ${
                                                                        isGoldWebinarMember ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-black' : 'gradient-lime text-black'
                                                                    }`}
                                                                >
                                                                    Watch Now
                                                                </button>
                                                            )
                                                        ) : (
                                                            session.zoomLink ? (
                                                                session.isLiveOrSoon ? (
                                                                    <button
                                                                        onClick={() => window.open(session.zoomLink!, '_blank')}
                                                                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shrink-0 hover:scale-105 transition-transform ${
                                                                            isGoldWebinarMember ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-black' : 'gradient-lime text-black'
                                                                        }`}
                                                                    >
                                                                        Join Now
                                                                    </button>
                                                                ) : (
                                                                    <span className="px-4 py-2 text-xs text-gray-500 border border-white/[0.06] rounded-lg shrink-0 font-bold uppercase tracking-wider bg-white/[0.02]">
                                                                        Coming Up
                                                                    </span>
                                                                )
                                                            ) : session.current ? (
                                                                <span className="px-4 py-2 text-xs text-gray-600 border border-white/[0.06] rounded-lg shrink-0 font-bold uppercase tracking-wider">Coming Up</span>
                                                            ) : null
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isLast && <div className="h-4" />}
                                        </div>
                                    )
                                })
                            )}

                            {/* Certificate milestone — webinar members only */}
                            {isWebinarMember && (
                                <div className="relative group">
                                    <div className={`absolute left-[35px] top-[60px] bottom-[-20px] w-px z-0 ${isGoldWebinarMember ? 'bg-amber-500/20' : 'bg-lime/20'}`} />
                                    
                                    <div className={`relative flex items-center gap-5 p-5 rounded-2xl border transition-all ${
                                        certificateClaimed
                                            ? (isGoldWebinarMember 
                                                ? 'bg-black/25 border-amber-500/10 hover:border-amber-500/20' 
                                                : 'bg-black/25 border-lime/10 hover:border-lime/20')
                                            : (isGoldWebinarMember
                                                ? 'bg-amber-500/[0.03] border-amber-500/35 shadow-[0_0_30px_rgba(245,158,11,0.08)]'
                                                : 'bg-lime/[0.03] border-lime/35 shadow-[0_0_30px_rgba(208,255,113,0.08)]')
                                    }`}>
                                        <div className="absolute inset-0 opacity-[0.01] z-0 pointer-events-none rounded-2xl" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                        }} />
                                        <div className="flex flex-col items-center shrink-0 w-10 relative z-10">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                certificateClaimed 
                                                    ? (isGoldWebinarMember ? 'bg-amber-500/10 text-amber-400' : 'bg-lime/10 text-lime') 
                                                    : (isGoldWebinarMember ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 text-black' : 'gradient-lime shadow-lg shadow-lime/20 text-black')
                                            }`}>
                                                {certificateClaimed ? (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                ) : (
                                                    <GraduationCap className="h-5 w-5" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 relative z-10">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className={`font-heading font-bold text-sm uppercase tracking-wide truncate ${certificateClaimed ? 'text-gray-400' : 'text-white'}`}>
                                                        AI Certificate of Completion
                                                    </p>
                                                    <p className={`text-xs mt-0.5 uppercase tracking-wider ${certificateClaimed ? 'text-gray-650' : 'text-gray-400'}`}>
                                                        {certificateClaimed ? 'CERTIFICATE CLAIMED!' : 'UNLOCKED FOR SILVER & GOLD TIERS'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowCertificateModal(true)}
                                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shrink-0 hover:scale-105 transition-transform ${
                                                        isGoldWebinarMember ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-black' : 'gradient-lime text-black'
                                                    }`}
                                                >
                                                    {certificateClaimed ? 'View Certificate' : 'Claim Certificate'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-4" />
                                </div>
                            )}

                            {/* Sprint Workshop milestone — webinar members only */}
                            {isWebinarMember && (
                                <div className="relative group">
                                    <div className={`relative flex items-center gap-5 p-5 rounded-2xl border transition-all bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10 hover:border-purple-500/35 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]`}>
                                        <div className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none rounded-2xl" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                        }} />
                                        <div className="flex flex-col items-center shrink-0 w-10 relative z-10">
                                            <div className="h-10 w-10 rounded-lg flex items-center justify-center relative z-10 bg-purple-500/10 text-purple-400">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 relative z-10">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-heading font-bold text-sm text-white uppercase tracking-wide truncate">
                                                        AI Sprint Workshop (Individuals)
                                                    </p>
                                                    <p className="text-xs mt-0.5 text-gray-400 uppercase tracking-wider">
                                                        UPGRADE YOUR SKILLS WITH THE FULL 3-DAY LIVE SPRINT WORKSHOP
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => window.open('/enroll', '_blank')}
                                                    className="px-4 py-2 text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300 uppercase tracking-wider rounded-lg shrink-0 hover:scale-105 transition-transform"
                                                >
                                                    Check Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                    </div>
                </motion.div>

                {/* Right Column — hidden for sprint and webinar members */}
                {!isSprintMember && !isWebinarMember && <div className="space-y-6">
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

                {/* Right Column — Upgrades sidebar for Webinar members */}
                {isWebinarMember && (
                    <div className="space-y-6">
                        {/* Webinar Gold Upgrade Card */}
                        {userProfileData?.upgrade_tier === 'gold' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-amber-500/10 text-left"
                            >
                                {/* Ambient gold glow */}
                                <div className="absolute -right-10 -top-10 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-heading">
                                            PASS ACTIVE
                                        </span>
                                        <Crown className="h-4 w-4 text-amber-400 animate-bounce" />
                                    </div>
                                    
                                    <h3 className="font-heading font-black text-white uppercase text-lg leading-tight">
                                        GOLD ACCESS UNLOCKED
                                    </h3>
                                    
                                    <p className="text-gray-300 text-xs leading-relaxed font-body">
                                        Your premium pass is active! Access all live session materials and download your resources.
                                    </p>
                                    
                                    <div className="border-t border-white/10 my-2" />
                                    
                                    <button
                                        onClick={() => window.open('https://drive.google.com', '_blank')}
                                        className="w-full py-2.5 rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 font-heading"
                                    >
                                        Download Presentation PDF
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#111111]/90 border border-amber-500 rounded-2xl p-6 relative overflow-hidden shadow-2xl shadow-amber-500/10 text-left hover:shadow-amber-500/20 transition-all duration-300"
                            >
                                <div className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none rounded-2xl" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                }} />
                                {/* Ambient gold glow */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/35 uppercase font-heading">
                                            PREMIUM UPGRADE
                                        </span>
                                        <Crown className="h-4 w-4 text-amber-400 animate-pulse" />
                                    </div>
                                    
                                    <h3 className="font-heading font-black text-white uppercase text-lg">
                                        UPGRADE TO <span className="text-amber-400 bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent font-black">GOLD TIER</span>
                                    </h3>
                                    
                                    <p className="text-gray-300 text-xs uppercase tracking-wider leading-relaxed font-heading font-medium">
                                        GET LIFETIME RECORDINGS ACCESS AND THE COMPLETE WORKSHOP SYSTEM PDF.
                                    </p>
                                    
                                    <div className="border-t border-white/10 my-2" />
                                    
                                    <div className="space-y-2.5 text-xs text-gray-300 font-heading font-bold">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                            <span className="uppercase tracking-wider">FULL WORKSHOP RECORDINGS (LIFETIME)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                            <span className="uppercase tracking-wider">COMPLETE WORKSHOP SYSTEM PDF</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={handleGoldUpgrade}
                                        disabled={upgradingToGold}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-heading shadow-lg shadow-amber-500/25"
                                    >
                                        {upgradingToGold ? 'PROCESSING...' : 'ONE-CLICK GOLD UPGRADE — $149'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Sprint Workshop Upgrade Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3 text-left"
                        >
                            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase font-heading">
                                Elite Training Workshop
                            </p>
                            <SprintCard 
                                sprintDates={sprintDates} 
                                sprintLocation={sprintLocation} 
                                checkoutUrl={`/checkout?email=${encodeURIComponent(user?.email || '')}&name=${encodeURIComponent(user?.full_name || '')}`}
                            />
                        </motion.div>
                    </div>
                )}
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
                {/* Floating Sprint Workshop Banner */}
                {showSprintBanner && (
                    <Portal>
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[460px] z-[80] bg-[#0c0c0c]/95 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-[0_10px_50px_rgba(168,85,247,0.2)] overflow-hidden text-left"
                        >
                            <div className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none rounded-3xl" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            }} />
                            <div className="absolute -top-12 -left-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-purple-300 border border-purple-500/25 bg-purple-500/5 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                        LIVE INTERACTIVITY
                                    </span>
                                    <button
                                        onClick={() => {
                                            setShowSprintBanner(false)
                                            localStorage.setItem('zkandar_sprint_banner_dismissed', 'true')
                                        }}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="font-heading font-black text-white uppercase text-lg leading-tight tracking-wide">
                                        AI SPRINT WORKSHOP INTERACTIVITY
                                    </h4>
                                    <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest font-heading">
                                        7 P.M. DUBAI TIME · LIVE ON ZOOM
                                    </p>
                                </div>

                                <p className="text-gray-300 text-xs uppercase tracking-wide leading-relaxed font-heading font-medium">
                                    UPGRADE YOUR SKILLS WITH THE FULL 3-DAY LIVE SPRINT WORKSHOP. LEAVE WITH REAL CLIENT-READY DELIVERABLES.
                                </p>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            window.open(`/checkout?email=${encodeURIComponent(user?.email || '')}&name=${encodeURIComponent(user?.full_name || '')}`, '_blank')
                                        }}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                                    >
                                        ENROLL IN SPRINT WORKSHOP
                                    </button>
                                    <button
                                        onClick={() => window.open('/enroll', '_blank')}
                                        className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        LEARN MORE
                                    </button>
                                </div>
                            </div>
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
                    isWebinarMember={isWebinarMember}
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
