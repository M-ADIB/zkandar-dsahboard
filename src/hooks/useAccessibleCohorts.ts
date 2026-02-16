import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import type { Cohort, CohortMembership } from '@/types/database'

export function useAccessibleCohorts() {
    const { user, loading: authLoading } = useAuth()
    const { company, loading: companyLoading } = useCompany()
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCohorts = useCallback(async () => {
        if (authLoading || companyLoading) return
        if (!user) {
            setCohorts([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const { data: membershipData, error: membershipError } = await supabase
            .from('cohort_memberships')
            .select('cohort_id')
            .eq('user_id', user.id)

        if (membershipError) {
            setError(membershipError.message)
            setCohorts([])
            setLoading(false)
            return
        }

        const membershipIds = ((membershipData as Pick<CohortMembership, 'cohort_id'>[]) ?? [])
            .map((membership) => membership.cohort_id)

        const cohortIds = new Set<string>()
        membershipIds.forEach((id) => cohortIds.add(id))
        if (company?.cohort_id) {
            cohortIds.add(company.cohort_id)
        }

        if (cohortIds.size === 0) {
            setCohorts([])
            setLoading(false)
            return
        }

        const { data: cohortData, error: cohortError } = await supabase
            .from('cohorts')
            .select('*')
            .in('id', Array.from(cohortIds))

        if (cohortError) {
            setError(cohortError.message)
            setCohorts([])
        } else {
            setCohorts((cohortData as Cohort[]) ?? [])
        }

        setLoading(false)
    }, [authLoading, companyLoading, user?.id, company?.cohort_id])

    useEffect(() => {
        fetchCohorts()
    }, [fetchCohorts])

    useEffect(() => {
        if (authLoading || !user) return

        const channel = supabase
            .channel(`cohort_memberships:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cohort_memberships',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchCohorts()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [authLoading, user?.id, fetchCohorts])

    const cohortIds = useMemo(() => cohorts.map((cohort) => cohort.id), [cohorts])

    return { cohorts, cohortIds, loading, error }
}
