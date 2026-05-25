import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Cohort } from '@/types/database'

export function useAccessibleCohorts(overrideUserId?: string | null) {
    const { user, loading: authLoading } = useAuth()
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const targetUserId = overrideUserId !== undefined ? overrideUserId : user?.id

    const fetchCohorts = useCallback(async () => {
        if (authLoading) return
        if (!targetUserId) {
            setCohorts([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // 1. Get the user's company linkage
            const { data: userData, error: userError } = await (supabase
                .from('users')
                .select('company_id')
                .eq('id', targetUserId)
                .maybeSingle() as any)

            if (userError) throw userError

            const companyId = userData?.company_id

            // 2. Get direct memberships
            const { data: membershipData, error: membershipError } = await supabase
                .from('cohort_memberships')
                .select('cohort_id')
                .eq('user_id', targetUserId)

            if (membershipError) throw membershipError

            const cohortIds = new Set<string>(
                ((membershipData as { cohort_id: string }[] | null) ?? []).map((m) => m.cohort_id)
            )

            // 3. Get company's cohort_id if applicable
            if (companyId) {
                const { data: companyData, error: companyError } = await (supabase
                    .from('companies')
                    .select('cohort_id')
                    .eq('id', companyId)
                    .maybeSingle() as any)

                if (companyError) throw companyError
                if (companyData?.cohort_id) {
                    cohortIds.add(companyData.cohort_id)
                }
            }

            if (cohortIds.size === 0) {
                setCohorts([])
                setLoading(false)
                return
            }

            // 4. Fetch the cohorts
            const { data: cohortData, error: cohortError } = await supabase
                .from('cohorts')
                .select('*')
                .in('id', Array.from(cohortIds))

            if (cohortError) throw cohortError

            setCohorts((cohortData as Cohort[]) ?? [])
        } catch (err: any) {
            setError(err.message)
            setCohorts([])
        } finally {
            setLoading(false)
        }
    }, [authLoading, targetUserId])

    useEffect(() => {
        fetchCohorts()
    }, [fetchCohorts])

    useEffect(() => {
        if (authLoading || !targetUserId) return

        const channel = supabase
            .channel(`cohort_memberships:${targetUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cohort_memberships',
                    filter: `user_id=eq.${targetUserId}`,
                },
                () => {
                    fetchCohorts()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [authLoading, targetUserId, fetchCohorts])

    const cohortIds = useMemo(() => cohorts.map((cohort) => cohort.id), [cohorts])

    return { cohorts, cohortIds, loading, error }
}
