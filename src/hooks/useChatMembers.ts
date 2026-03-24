import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { ChatChannel } from '@/hooks/useChatChannels'

export interface ChatMember {
    id: string
    full_name: string
    role: string
}

/**
 * Fetches users belonging to the given chat channel.
 * - Company channels (team/management): users with matching company_id + admins/owners
 * - Sprint channels: users in cohort_memberships + admins/owners
 */
export function useChatMembers(channel: ChatChannel | null) {
    const { user } = useAuth()
    const [members, setMembers] = useState<ChatMember[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!channel || !user) {
            setMembers([])
            return
        }

        let ignore = false

        const fetchMembers = async () => {
            setLoading(true)

            try {
                if (channel.type === 'sprint' && channel.cohortId) {
                    // Sprint channel: get users from cohort_memberships + admins
                    const { data: membershipData } = await supabase
                        .from('cohort_memberships')
                        .select('user:users!cohort_memberships_user_id_fkey(id, full_name, role)')
                        .eq('cohort_id', channel.cohortId)

                    const cohortUsers = (membershipData ?? [])
                        .map((m: any) => m.user)
                        .filter(Boolean) as ChatMember[]

                    // Also fetch admins/owners who aren't already in the list
                    const { data: admins } = await supabase
                        .from('users')
                        .select('id, full_name, role')
                        .in('role', ['owner', 'admin'])

                    const adminUsers = (admins ?? []) as ChatMember[]
                    const allIds = new Set(cohortUsers.map(u => u.id))
                    const merged = [...cohortUsers]
                    for (const a of adminUsers) {
                        if (!allIds.has(a.id)) merged.push(a)
                    }

                    if (!ignore) setMembers(merged.filter(m => m.id !== user.id))
                } else if (channel.companyId) {
                    // Company channel (team/management): users in the same company + admins
                    const { data: companyUsers } = await supabase
                        .from('users')
                        .select('id, full_name, role')
                        .eq('company_id', channel.companyId)

                    const cuList = (companyUsers ?? []) as ChatMember[]

                    // Also fetch admins/owners
                    const { data: admins } = await supabase
                        .from('users')
                        .select('id, full_name, role')
                        .in('role', ['owner', 'admin'])

                    const adminUsers = (admins ?? []) as ChatMember[]
                    const allIds = new Set(cuList.map(u => u.id))
                    const merged = [...cuList]
                    for (const a of adminUsers) {
                        if (!allIds.has(a.id)) merged.push(a)
                    }

                    if (!ignore) setMembers(merged.filter(m => m.id !== user.id))
                }
            } catch (err) {
                console.error('Failed to fetch chat members:', err)
            }

            if (!ignore) setLoading(false)
        }

        fetchMembers()
        return () => { ignore = true }
    }, [channel?.id, user?.id])

    return { members, loading }
}
