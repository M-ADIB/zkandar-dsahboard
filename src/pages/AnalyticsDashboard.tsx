import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { MessageSquare, TrendingUp, Users, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ChatMessage, Cohort, CohortMembership, Company, OfferingType, Session, User } from '@/types/database'

const toolPalette = ['#D0FF71', '#5A9F2E', '#75C345', '#9AD41A', '#B8F23E', '#A3D783']

type OfferingFilter = 'all' | OfferingType

export function AnalyticsDashboard() {
    const [users, setUsers] = useState<User[]>([])
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [memberships, setMemberships] = useState<CohortMembership[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [offeringFilter, setOfferingFilter] = useState<OfferingFilter>('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let ignore = false

        const fetchData = async () => {
            setLoading(true)
            setError(null)

            const since = new Date()
            since.setDate(since.getDate() - 7)

            const [usersResult, cohortsResult, membershipsResult, chatResult] = await Promise.all([
                supabase
                    .from('users')
                    .select('id, full_name, role, user_type, company_id, ai_readiness_score, onboarding_completed, onboarding_data, created_at'),
                supabase
                    .from('cohorts')
                    .select('id, name, offering_type, status, start_date, end_date'),
                supabase
                    .from('cohort_memberships')
                    .select('user_id, cohort_id'),
                supabase
                    .from('chat_messages')
                    .select('id, cohort_id, company_id, created_at')
                    .gte('created_at', since.toISOString()),
            ])

            const companiesResult = await (async () => {
                const result = await supabase
                    .from('companies')
                    .select('id, cohort_id')

                if (!result.error) return result
                if (!result.error.message.includes('cohort_id')) return result

                const fallback = await supabase
                    .from('companies')
                    .select('id')

                if (fallback.error) return fallback

                return {
                    data: ((fallback.data as Company[]) ?? []).map((row) => ({
                        ...row,
                        cohort_id: null,
                    })),
                    error: null,
                }
            })()

            const sessionsResult = await (async () => {
                const result = await supabase
                    .from('sessions')
                    .select('id, cohort_id, status, scheduled_date')

                if (!result.error) return result

                const missingScheduledDate = result.error.message.includes('scheduled_date')
                const missingCohortId = result.error.message.includes('cohort_id')

                if (!missingScheduledDate && !missingCohortId) return result

                const fallbackSelect = missingCohortId
                    ? 'id, status, created_at'
                    : 'id, cohort_id, status, created_at'

                const fallback = await supabase
                    .from('sessions')
                    .select(fallbackSelect)

                if (fallback.error) return fallback

                return {
                    data: ((fallback.data as Session[]) ?? []).map((row) => ({
                        ...row,
                        cohort_id: row.cohort_id ?? '',
                        scheduled_date: row.created_at,
                    })),
                    error: null,
                }
            })()

            if (ignore) return

            const errors = [
                usersResult.error,
                cohortsResult.error,
                membershipsResult.error,
                companiesResult.error,
                sessionsResult.error,
                chatResult.error,
            ].filter(Boolean)

            if (errors.length > 0) {
                setError(errors[0]?.message ?? 'Failed to load analytics')
                setLoading(false)
                return
            }

            setUsers((usersResult.data as User[]) ?? [])
            setCohorts((cohortsResult.data as Cohort[]) ?? [])
            setMemberships((membershipsResult.data as CohortMembership[]) ?? [])
            setCompanies((companiesResult.data as Company[]) ?? [])
            setSessions((sessionsResult.data as Session[]) ?? [])
            setChatMessages((chatResult.data as ChatMessage[]) ?? [])
            setLoading(false)
        }

        fetchData()

        return () => {
            ignore = true
        }
    }, [])

    const companyMap = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies])

    const offeringCohortIds = useMemo(() => {
        if (offeringFilter === 'all') return cohorts.map((cohort) => cohort.id)
        return cohorts.filter((cohort) => cohort.offering_type === offeringFilter).map((cohort) => cohort.id)
    }, [cohorts, offeringFilter])

    const offeringCohortSet = useMemo(() => new Set(offeringCohortIds), [offeringCohortIds])

    const membershipMap = useMemo(() => {
        const map = new Map<string, Set<string>>()
        memberships.forEach((membership) => {
            const existing = map.get(membership.user_id) ?? new Set<string>()
            existing.add(membership.cohort_id)
            map.set(membership.user_id, existing)
        })
        return map
    }, [memberships])

    const eligibleUsers = useMemo(() => {
        return users.filter((user) => {
            if (user.role === 'owner' || user.role === 'admin') return false

            const programIds = new Set(membershipMap.get(user.id) ?? [])
            if (user.company_id) {
                const company = companyMap.get(user.company_id)
                if (company?.cohort_id) programIds.add(company.cohort_id)
            }

            if (programIds.size === 0) return false

            if (offeringFilter === 'all') return true
            for (const id of programIds) {
                if (offeringCohortSet.has(id)) return true
            }
            return false
        })
    }, [users, membershipMap, companyMap, offeringFilter, offeringCohortSet])

    const eligibleCohorts = useMemo(() => {
        if (offeringFilter === 'all') return cohorts
        return cohorts.filter((cohort) => cohort.offering_type === offeringFilter)
    }, [cohorts, offeringFilter])

    const sessionCompletionData = useMemo(() => {
        const counts = new Map<string, { completed: number; total: number }>()
        eligibleCohorts.forEach((cohort) => counts.set(cohort.id, { completed: 0, total: 0 }))

        sessions.forEach((session) => {
            if (!offeringCohortSet.has(session.cohort_id)) return
            const entry = counts.get(session.cohort_id)
            if (!entry) return
            entry.total += 1
            if (session.status === 'completed') entry.completed += 1
        })

        return eligibleCohorts.map((cohort) => {
            const entry = counts.get(cohort.id) ?? { completed: 0, total: 0 }
            const completionRate = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0
            return {
                name: cohort.name,
                completionRate,
                completed: entry.completed,
                total: entry.total,
            }
        })
    }, [eligibleCohorts, sessions, offeringCohortSet])

    const readinessTrendData = useMemo(() => {
        const now = new Date()
        const months: { key: string; label: string; sum: number; count: number }[] = []

        for (let i = 5; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const label = date.toLocaleString('default', { month: 'short' })
            months.push({ key, label, sum: 0, count: 0 })
        }

        const monthMap = new Map(months.map((month) => [month.key, month]))

        eligibleUsers.forEach((user) => {
            const completedAt = (user.onboarding_data as { completed_at?: string } | null)?.completed_at || user.created_at
            const date = new Date(completedAt)
            if (Number.isNaN(date.getTime())) return
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const bucket = monthMap.get(key)
            if (!bucket) return
            bucket.sum += user.ai_readiness_score || 0
            bucket.count += 1
        })

        return months.map((month) => ({
            period: month.label,
            score: month.count > 0 ? Math.round(month.sum / month.count) : 0,
        }))
    }, [eligibleUsers])

    const toolAdoptionData = useMemo(() => {
        const toolCounts: Record<string, number> = {}
        let respondentCount = 0

        eligibleUsers.forEach((user) => {
            const surveyAnswers = (user.onboarding_data as { survey_answers?: Record<string, unknown> } | null)?.survey_answers
            const toolsRaw = surveyAnswers?.ai_tools_used

            const tools = Array.isArray(toolsRaw)
                ? toolsRaw
                : typeof toolsRaw === 'string'
                    ? [toolsRaw]
                    : []

            if (tools.length === 0) return

            respondentCount += 1
            tools.forEach((tool) => {
                if (tool === 'None of the above') return
                toolCounts[tool] = (toolCounts[tool] || 0) + 1
            })
        })

        if (respondentCount === 0) return [] as { name: string; value: number; color: string }[]

        return Object.entries(toolCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count], index) => ({
                name,
                value: Math.round((count / respondentCount) * 100),
                color: toolPalette[index % toolPalette.length],
            }))
    }, [eligibleUsers])

    const chatEngagementData = useMemo(() => {
        const now = new Date()
        const days: { key: string; label: string; count: number }[] = []
        for (let i = 6; i >= 0; i -= 1) {
            const date = new Date(now)
            date.setDate(now.getDate() - i)
            const key = date.toISOString().slice(0, 10)
            const label = date.toLocaleString('default', { weekday: 'short' })
            days.push({ key, label, count: 0 })
        }

        const dayMap = new Map(days.map((day) => [day.key, day]))

        chatMessages.forEach((message) => {
            const cohortId = message.cohort_id
            if (offeringFilter !== 'all') {
                if (cohortId && !offeringCohortSet.has(cohortId)) {
                    return
                }
                if (!cohortId && message.company_id) {
                    const company = companyMap.get(message.company_id)
                    if (!company?.cohort_id || !offeringCohortSet.has(company.cohort_id)) return
                }
            }

            const dateKey = new Date(message.created_at).toISOString().slice(0, 10)
            const bucket = dayMap.get(dateKey)
            if (bucket) bucket.count += 1
        })

        return days.map((day) => ({ day: day.label, messages: day.count }))
    }, [chatMessages, offeringFilter, offeringCohortSet, companyMap])

    const messagesToday = useMemo(() => {
        const now = Date.now()
        const cutoff = now - 24 * 60 * 60 * 1000
        return chatMessages.filter((message) => {
            const messageTime = new Date(message.created_at).getTime()
            if (messageTime < cutoff) return false
            if (offeringFilter === 'all') return true

            if (message.cohort_id && offeringCohortSet.has(message.cohort_id)) return true
            if (message.company_id) {
                const company = companyMap.get(message.company_id)
                return company?.cohort_id ? offeringCohortSet.has(company.cohort_id) : false
            }
            return false
        }).length
    }, [chatMessages, offeringFilter, offeringCohortSet, companyMap])

    const averageReadiness = useMemo(() => {
        if (eligibleUsers.length === 0) return 0
        const total = eligibleUsers.reduce((sum, user) => sum + (user.ai_readiness_score || 0), 0)
        return Math.round(total / eligibleUsers.length)
    }, [eligibleUsers])

    const stats = useMemo(() => ([
        { icon: Users, label: 'Total Participants', value: String(eligibleUsers.length) },
        { icon: GraduationCap, label: 'Active Programs', value: String(eligibleCohorts.filter((cohort) => cohort.status === 'active').length) },
        { icon: TrendingUp, label: 'Avg AI Readiness', value: `${averageReadiness}%` },
        { icon: MessageSquare, label: 'Messages (24h)', value: String(messagesToday) },
    ]), [eligibleUsers.length, eligibleCohorts, averageReadiness, messagesToday])

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Analytics</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Track program progress, readiness, and engagement
                    </p>
                </div>
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Offering Type</label>
                    <select
                        value={offeringFilter}
                        onChange={(e) => setOfferingFilter(e.target.value as OfferingFilter)}
                        className="w-full px-3 py-2 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                    >
                        <option value="all">All Programs</option>
                        <option value="sprint_workshop">Sprint Workshop</option>
                        <option value="master_class">Master Class</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Stats Row */}
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading analytics...</div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-bg-card border border-border rounded-2xl p-5"
                            >
                                <Icon className="h-5 w-5 text-lime mb-3" />
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Session Completion Rate</h3>
                    <div className="h-64">
                        {sessionCompletionData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No session data yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sessionCompletionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                    <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#666', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number, _name, props) => {
                                            const completed = props.payload.completed
                                            const total = props.payload.total
                                            return [`${value}% (${completed}/${total})`, 'Completion']
                                        }}
                                    />
                                    <Bar dataKey="completionRate" fill="#D0FF71" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* AI Readiness Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">AI Readiness Score Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={readinessTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#666', fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#D0FF71"
                                    strokeWidth={3}
                                    dot={{ fill: '#D0FF71', strokeWidth: 0, r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Tool Adoption */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Tool Adoption</h3>
                    <div className="h-64 flex items-center">
                        {toolAdoptionData.length === 0 ? (
                            <div className="w-full text-center text-gray-500 text-sm">No survey data yet.</div>
                        ) : (
                            <>
                                <div className="w-1/2">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={toolAdoptionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                dataKey="value"
                                                paddingAngle={3}
                                            >
                                                {toolAdoptionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-1/2 space-y-3">
                                    {toolAdoptionData.map((tool) => (
                                        <div key={tool.name} className="flex items-center gap-3">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: tool.color }}
                                            />
                                            <span className="text-sm flex-1">{tool.name}</span>
                                            <span className="text-sm text-gray-400">{tool.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Engagement Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Chat Engagement (7 days)</h3>
                    <div className="h-64">
                        {chatEngagementData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No chat data yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chatEngagementData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                    <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="messages" fill="#5A9F2E" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
