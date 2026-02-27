import { useEffect, useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@/types/database'

interface WorkspaceAttendanceProps {
    sessions: Session[]
    members: User[]
}

interface AttendanceRecord {
    session_id: string
    user_id: string
}

export function WorkspaceAttendance({ sessions, members }: WorkspaceAttendanceProps) {
    const [attendance, setAttendance] = useState<Set<string>>(new Set()) // "sessionId:userId"
    const [isLoading, setIsLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)

    const makeKey = (sessionId: string, userId: string) => `${sessionId}:${userId}`

    const fetchAttendance = async () => {
        setIsLoading(true)
        const sessionIds = sessions.map((s) => s.id)
        if (sessionIds.length === 0) { setAttendance(new Set()); setIsLoading(false); return }

        const { data } = await supabase
            .from('session_attendance')
            .select('session_id, user_id')
            .in('session_id', sessionIds)

        const set = new Set<string>()
            ; (data as AttendanceRecord[] | null)?.forEach((r) => set.add(makeKey(r.session_id, r.user_id)))
        setAttendance(set)
        setIsLoading(false)
    }

    useEffect(() => { fetchAttendance() }, [sessions])

    const toggleAttendance = async (sessionId: string, userId: string) => {
        const key = makeKey(sessionId, userId)
        setToggling(key)

        if (attendance.has(key)) {
            // Remove
            await supabase.from('session_attendance').delete().eq('session_id', sessionId).eq('user_id', userId)
            setAttendance((prev) => { const n = new Set(prev); n.delete(key); return n })
        } else {
            // Insert
            // @ts-expect-error - Supabase insert type
            await supabase.from('session_attendance').insert({ session_id: sessionId, user_id: userId })
            setAttendance((prev) => new Set(prev).add(key))
        }
        setToggling(null)
    }

    if (sessions.length === 0 || members.length === 0) return null

    const completedSessions = sessions.filter((s) => s.status === 'completed')
    if (completedSessions.length === 0) return null

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-lime" />
                Attendance
            </h4>

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-lime" />
                </div>
            ) : (
                <div className="bg-bg-elevated border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-4 py-3 text-gray-500 font-medium sticky left-0 bg-bg-elevated z-10">Member</th>
                                    {completedSessions.map((s) => (
                                        <th key={s.id} className="text-center px-3 py-3 text-gray-500 font-medium whitespace-nowrap">
                                            S{s.session_number}
                                        </th>
                                    ))}
                                    <th className="text-center px-3 py-3 text-gray-500 font-medium">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => {
                                    const attended = completedSessions.filter((s) => attendance.has(makeKey(s.id, member.id))).length
                                    const rate = completedSessions.length > 0 ? Math.round((attended / completedSessions.length) * 100) : 0
                                    return (
                                        <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-white/5 transition">
                                            <td className="px-4 py-2.5 text-white font-medium sticky left-0 bg-bg-elevated whitespace-nowrap">
                                                {member.full_name || member.email}
                                            </td>
                                            {completedSessions.map((s) => {
                                                const key = makeKey(s.id, member.id)
                                                const isPresent = attendance.has(key)
                                                const isBusy = toggling === key
                                                return (
                                                    <td key={s.id} className="text-center px-3 py-2.5">
                                                        <button
                                                            onClick={() => toggleAttendance(s.id, member.id)}
                                                            disabled={isBusy}
                                                            className={`h-6 w-6 mx-auto rounded-md border transition ${isPresent
                                                                    ? 'bg-lime/20 border-lime/40 text-lime'
                                                                    : 'bg-white/5 border-border text-transparent hover:border-gray-500'
                                                                } ${isBusy ? 'opacity-50' : ''}`}
                                                        >
                                                            {isPresent ? '✓' : ''}
                                                        </button>
                                                    </td>
                                                )
                                            })}
                                            <td className="text-center px-3 py-2.5">
                                                <span className={`font-medium ${rate >= 80 ? 'text-lime' : rate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            {/* Summary row */}
                            <tfoot>
                                <tr className="bg-white/5">
                                    <td className="px-4 py-2.5 text-gray-400 font-medium sticky left-0 bg-white/5">Avg</td>
                                    {completedSessions.map((s) => {
                                        const count = members.filter((m) => attendance.has(makeKey(s.id, m.id))).length
                                        const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0
                                        return (
                                            <td key={s.id} className="text-center px-3 py-2.5 text-gray-400">
                                                {pct}%
                                            </td>
                                        )
                                    })}
                                    <td className="text-center px-3 py-2.5 text-gray-400">—</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
