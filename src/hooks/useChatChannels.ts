import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface ChatChannel {
    id: string
    name: string
    type: 'team' | 'management' | 'sprint'
    companyId?: string
    cohortId?: string
    parentName: string
}

export interface ChannelGroup {
    parentId: string
    parentName: string
    offeringType: 'master_class' | 'sprint_workshop'
    channels: ChatChannel[]
}

interface CompanyRow {
    id: string
    name: string
    cohort_id: string | null
}

interface CohortRow {
    id: string
    name: string
    offering_type: string
}

export function useChatChannels() {
    const { user, loading: authLoading } = useAuth()
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [loading, setLoading] = useState(true)

    const isAdmin = user?.role === 'admin' || user?.role === 'owner'

    useEffect(() => {
        if (authLoading || !user) {
            setGroups([])
            setLoading(false)
            return
        }

        let cancelled = false

        const fetchChannels = async () => {
            setLoading(true)
            const result: ChannelGroup[] = []

            // 1. Fetch masterclass companies
            if (isAdmin) {
                const { data } = await (supabase
                    .from('companies')
                    .select('id, name, cohort_id') as any)

                const companies = (data ?? []) as CompanyRow[]

                for (const co of companies) {
                    if (!co.cohort_id) continue

                    const { data: cohortData } = await (supabase
                        .from('cohorts')
                        .select('offering_type')
                        .eq('id', co.cohort_id)
                        .single() as any)

                    const cohort = cohortData as CohortRow | null
                    if (cohort?.offering_type !== 'master_class') continue

                    result.push({
                        parentId: co.id,
                        parentName: co.name,
                        offeringType: 'master_class',
                        channels: [
                            {
                                id: `team:${co.id}`,
                                name: 'Team Chat',
                                type: 'team',
                                companyId: co.id,
                                parentName: co.name,
                            },
                            {
                                id: `management:${co.id}`,
                                name: 'Management Chat',
                                type: 'management',
                                companyId: co.id,
                                parentName: co.name,
                            },
                        ],
                    })
                }
            } else if (user.company_id) {
                const { data } = await (supabase
                    .from('companies')
                    .select('id, name, cohort_id')
                    .eq('id', user.company_id)
                    .single() as any)

                const co = data as CompanyRow | null

                if (co && co.cohort_id) {
                    const { data: cohortData } = await (supabase
                        .from('cohorts')
                        .select('offering_type')
                        .eq('id', co.cohort_id)
                        .single() as any)

                    const cohort = cohortData as CohortRow | null

                    if (cohort?.offering_type === 'master_class') {
                        const channels: ChatChannel[] = [
                            {
                                id: `team:${co.id}`,
                                name: 'Team Chat',
                                type: 'team',
                                companyId: co.id,
                                parentName: co.name,
                            },
                        ]

                        if (user.user_type === 'management') {
                            channels.push({
                                id: `management:${co.id}`,
                                name: 'Management Chat',
                                type: 'management',
                                companyId: co.id,
                                parentName: co.name,
                            })
                        }

                        result.push({
                            parentId: co.id,
                            parentName: co.name,
                            offeringType: 'master_class',
                            channels,
                        })
                    }
                }
            }

            // 2. Fetch sprint workshop cohorts
            if (isAdmin) {
                const { data } = await (supabase
                    .from('cohorts')
                    .select('id, name')
                    .eq('offering_type', 'sprint_workshop')
                    .in('status', ['upcoming', 'active']) as any)

                const sprints = (data ?? []) as CohortRow[]

                for (const sp of sprints) {
                    result.push({
                        parentId: sp.id,
                        parentName: sp.name,
                        offeringType: 'sprint_workshop',
                        channels: [{
                            id: `sprint:${sp.id}`,
                            name: 'Sprint Chat',
                            type: 'sprint',
                            cohortId: sp.id,
                            parentName: sp.name,
                        }],
                    })
                }
            } else {
                const { data: memberships } = await supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', user.id)

                const memberCohortIds = (memberships ?? []).map((m: any) => m.cohort_id)

                if (memberCohortIds.length > 0) {
                    const { data } = await (supabase
                        .from('cohorts')
                        .select('id, name')
                        .eq('offering_type', 'sprint_workshop')
                        .in('status', ['upcoming', 'active'])
                        .in('id', memberCohortIds) as any)

                    const sprints = (data ?? []) as CohortRow[]

                    for (const sp of sprints) {
                        result.push({
                            parentId: sp.id,
                            parentName: sp.name,
                            offeringType: 'sprint_workshop',
                            channels: [{
                                id: `sprint:${sp.id}`,
                                name: 'Sprint Chat',
                                type: 'sprint',
                                cohortId: sp.id,
                                parentName: sp.name,
                            }],
                        })
                    }
                }
            }

            if (!cancelled) {
                setGroups(result)
                setLoading(false)
            }
        }

        fetchChannels()

        return () => {
            cancelled = true
        }
    }, [authLoading, user?.id, user?.company_id, user?.user_type, user?.role, isAdmin])

    const allChannels = useMemo(() => groups.flatMap(g => g.channels), [groups])

    return { groups, allChannels, loading }
}
