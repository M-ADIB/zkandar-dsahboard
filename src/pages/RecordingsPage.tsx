import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Film, Play, Calendar, ExternalLink, Search, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { formatSessionDateTime } from '@/lib/time'
import type { Session, Cohort } from '@/types/database'
import { VideoModal } from '@/components/shared/VideoModal'

interface RecordingCard {
    id: string
    title: string
    sessionNumber: number
    scheduledDate: string
    recordingUrl: string
    programName: string
    status: 'completed' | 'scheduled'
}

function RecordingThumbnail({ videoUrl, hasRecording }: { videoUrl: string; hasRecording: boolean }) {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!hasRecording || !videoUrl) return

        const fetchThumbnail = async () => {
            try {
                if (videoUrl.includes('vimeo.com')) {
                    const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`)
                    if (response.ok) {
                        const data = await response.json()
                        if (data.thumbnail_url) {
                            setThumbnailUrl(data.thumbnail_url)
                        }
                    }
                } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i)
                    if (ytMatch) {
                        setThumbnailUrl(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`)
                    }
                }
            } catch (error) {
                console.error('Error fetching video thumbnail:', error)
            }
        }

        fetchThumbnail()
    }, [videoUrl, hasRecording])

    if (thumbnailUrl) {
        return (
            <img 
                src={thumbnailUrl} 
                alt="Video Thumbnail" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        )
    }

    return null
}

export function RecordingsPage() {
    const { user, loading: authLoading } = useAuth()
    const { effectiveUserId } = useViewMode()
    const [recordings, setRecordings] = useState<RecordingCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

    const userId = effectiveUserId || user?.id

    useEffect(() => {
        if (authLoading || !userId) return

        const fetchRecordings = async () => {
            setLoading(true)
            setError(null)

            // 1. Get the user's company → cohort linkage
            const { data: userData } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', userId)
                .single()

            const companyId = (userData as { company_id: string | null } | null)?.company_id

            // 2. Collect cohort IDs from company AND direct memberships
            const cohortIdSet = new Set<string>()

            // Direct memberships (sprint workshops)
            const { data: membershipData } = await supabase
                .from('cohort_memberships')
                .select('cohort_id')
                .eq('user_id', userId)

            const membershipIds = ((membershipData as { cohort_id: string }[] | null) ?? []).map((m) => m.cohort_id)
            membershipIds.forEach((id) => cohortIdSet.add(id))

            // Company → cohort
            if (companyId) {
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('cohort_id')
                    .eq('id', companyId)
                    .single()

                const compRow = companyData as { cohort_id: string | null } | null
                if (compRow?.cohort_id) cohortIdSet.add(compRow.cohort_id)
            }

            const cohortIds = Array.from(cohortIdSet)

            if (cohortIds.length === 0) {
                setRecordings([])
                setLoading(false)
                return
            }

            // 3. Fetch cohorts for program names
            const { data: cohortsData } = await supabase
                .from('cohorts')
                .select('id, name')
                .in('id', cohortIds)

            const cohortMap = new Map(((cohortsData as Cohort[]) ?? []).map((c) => [c.id, c.name]))

            // 4. Fetch all sessions with recordings
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, title, session_number, scheduled_date, recording_url, status, cohort_id')
                .in('cohort_id', cohortIds)
                .order('scheduled_date', { ascending: true })

            if (sessionsError) {
                setError(sessionsError.message)
                setRecordings([])
                setLoading(false)
                return
            }

            const sessions = (sessionsData as Session[]) ?? []

            const cards: RecordingCard[] = sessions.map((s) => ({
                id: s.id,
                title: s.title,
                sessionNumber: s.session_number,
                scheduledDate: s.scheduled_date,
                recordingUrl: s.recording_url ?? '',
                programName: cohortMap.get(s.cohort_id) ?? 'Program',
                status: s.status as 'completed' | 'scheduled',
            }))

            setRecordings(cards)
            setLoading(false)
        }

        fetchRecordings()
    }, [authLoading, userId])

    const filteredRecordings = recordings.filter((r) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return r.title.toLowerCase().includes(q) || r.programName.toLowerCase().includes(q)
    })

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Recordings</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Rewatch your session recordings at any time
                    </p>
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search recordings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-400">{error}</div>
            ) : filteredRecordings.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Film className="h-8 w-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-lg font-medium">No recordings available yet</p>
                    <p className="text-gray-600 text-sm mt-1">
                        {user?.user_type === 'webinar_member' 
                            ? 'Recordings will appear here after your webinar days are completed'
                            : 'Recordings will appear here after your sessions are completed'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredRecordings.map((recording, index) => {
                        const hasRecording = Boolean(recording.recordingUrl)
                        const CardWrapper = motion.div
                        const wrapperProps = hasRecording ? {
                            onClick: () => setActiveVideoUrl(recording.recordingUrl)
                        } : {}

                        return (
                            <CardWrapper
                                key={recording.id}
                                {...wrapperProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                className={`group relative bg-bg-card border rounded-2xl overflow-hidden transition-all duration-300 text-left ${
                                    hasRecording 
                                        ? 'border-border hover:border-lime/30 hover:shadow-[0_0_30px_rgba(208,255,113,0.06)] cursor-pointer' 
                                        : 'border-border/50 opacity-40'
                                }`}
                            >
                                {/* Thumbnail area */}
                                <div className="relative h-40 bg-gradient-to-br from-lime/5 via-transparent to-green/5 flex items-center justify-center overflow-hidden">
                                    <RecordingThumbnail videoUrl={recording.recordingUrl} hasRecording={hasRecording} />

                                    {/* Dark overlay for thumbnail image */}
                                    {hasRecording && (
                                        <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors duration-300 z-10" />
                                    )}

                                    {/* Noise texture overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] z-10" style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                    }} />

                                    {/* Session number badge */}
                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-[11px] font-medium text-gray-300 z-20">
                                        {user?.user_type === 'webinar_member'
                                            ? `Webinar Day ${recording.sessionNumber}`
                                            : `Session ${recording.sessionNumber}`}
                                    </div>

                                    {/* Play or Lock button */}
                                    {hasRecording ? (
                                        <div className="h-14 w-14 rounded-full bg-lime/90 flex items-center justify-center shadow-lg shadow-lime/20 group-hover:scale-110 transition-transform duration-300 z-20">
                                            <Play className="h-6 w-6 text-black ml-0.5" />
                                        </div>
                                    ) : (
                                        <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center z-20">
                                            <Lock className="h-6 w-6 text-gray-500" />
                                        </div>
                                    )}

                                    {/* External link hint */}
                                    {hasRecording && (
                                        <div className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className={`font-semibold text-sm transition-colors line-clamp-1 ${hasRecording ? 'text-white group-hover:text-lime' : 'text-gray-500'}`}>
                                            {recording.title}
                                        </h3>
                                        <p className="text-xs text-lime/70 mt-0.5">{recording.programName}</p>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatSessionDateTime(recording.scheduledDate)}
                                        </span>
                                    </div>
                                </div>
                            </CardWrapper>
                        )
                    })}
                </div>
            )}

            <VideoModal
                isOpen={!!activeVideoUrl}
                videoUrl={activeVideoUrl || ''}
                onClose={() => setActiveVideoUrl(null)}
            />
        </div>
    )
}
