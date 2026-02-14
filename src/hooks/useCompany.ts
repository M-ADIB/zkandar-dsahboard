import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Company } from '@/types/database'

export function useCompany() {
    const { user, loading: authLoading } = useAuth()
    const [company, setCompany] = useState<Company | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return
        const companyId = user?.company_id

        if (!companyId) {
            setCompany(null)
            setLoading(false)
            setError(null)
            return
        }

        let isMounted = true

        const fetchCompany = async () => {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single()

            if (!isMounted) return

            if (fetchError) {
                setError(fetchError.message)
                setCompany(null)
            } else {
                setCompany(data as Company)
            }

            setLoading(false)
        }

        fetchCompany()

        return () => {
            isMounted = false
        }
    }, [authLoading, user?.company_id])

    return { company, loading, error }
}
