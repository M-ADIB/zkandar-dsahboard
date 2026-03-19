import { useMemo, useState } from 'react'
import { Calendar, Film, FileText, Link as LinkIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { SessionModal } from '@/components/admin/programs/SessionModal'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Session, SessionStatus } from '@/types/database'

interface WorkspaceSessionsProps {
    cohortId: string
    sessions: Session[]
    onSessionsChange: () => void
}

const statusBadge: Record<SessionStatus, string> = {
    scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    completed: 'bg-lime/10 text-lime border-lime/30',
}

export function WorkspaceSessions({ cohortId, sessions, onSessionsChange }: WorkspaceSessionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [editingRecording, setEditingRecording] = useState<string | null>(null) // session id
    const [recordingUrl, setRecordingUrl] = useState('')
    const [savingRecording, setSavingRecording] = useState(false)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const nextSessionNumber = useMemo(() => {
        if (sessions.length === 0) return 1
        return Math.max(...sessions.map((s) => s.session_number || 0)) + 1
    }, [sessions])

    const handleDelete = async (session: Session) => {
        if (confirmDeleteId !== session.id) {
            setConfirmDeleteId(session.id)
            return
        }
        setDeleteError(null)
        const { error } = await supabase.from('sessions').delete().eq('id', session.id)
        if (error) {
            setDeleteError(error.message)
            setConfirmDeleteId(null)
            return
        }
        setConfirmDeleteId(null)
        onSessionsChange()
    }

    const handleSaveRecording = async (sessionId: string) => {
        setSavingRecording(true)
        // @ts-expect-error - Supabase update type
        await supabase.from('sessions').update({ recording_url: recordingUrl.trim() || null }).eq('id', sessionId)
        setSavingRecording(false)
        setEditingRecording(null)
        onSessionsChange()
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-lime" />
                    Sessions ({sessions.length})
                </h4>
                <button
                    onClick={() => { setSelectedSession(null); setIsModalOpen(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg gradient-lime text-black hover:opacity-90 transition"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Session
                </button>
            </div>

            {deleteError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    Delete failed: {deleteError}
                </div>
            )}

            {sessions.length === 0 ? (
                <div className="rounded-xl border border-border border-dashed bg-bg-elevated/50 p-6 text-center">
                    <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No sessions yet. Add your first session.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <motion.div
                            key={session.id}
                            layout
                            className="bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-4 hover:border-lime/20 hover:bg-white/[0.04] transition-all duration-300"
                        >
                            <div className="flex items-start gap-3">
                                {/* Session number badge */}
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${session.status === 'completed' ? 'bg-lime/10 text-lime' : 'bg-white/5 text-gray-400'}`}>
                                    {session.session_number ?? '—'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-white truncate">{session.title}</p>
                                        <span className={`px-2 py-0.5 text-[10px] rounded-md border shrink-0 ${statusBadge[session.status]}`}>
                                            {session.status === 'completed' ? 'Done' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {formatDateLabel(session.scheduled_date) || 'TBD'}
                                        {formatTimeLabel(session.scheduled_date) ? ` · ${formatTimeLabel(session.scheduled_date)}` : ''}
                                    </p>

                                    {/* Recording */}
                                    {editingRecording === session.id ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="url"
                                                value={recordingUrl}
                                                onChange={(e) => setRecordingUrl(e.target.value)}
                                                placeholder="Paste recording URL..."
                                                className="flex-1 px-2.5 py-1.5 text-xs bg-bg-card border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveRecording(session.id)}
                                                disabled={savingRecording}
                                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg gradient-lime text-black hover:opacity-90 disabled:opacity-50"
                                            >
                                                {savingRecording ? '...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setEditingRecording(null)}
                                                className="px-2 py-1.5 text-xs text-gray-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : session.recording_url ? (
                                        <a
                                            href={session.recording_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-lime hover:underline"
                                        >
                                            <Film className="h-3.5 w-3.5" />
                                            Watch Recording
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => { setEditingRecording(session.id); setRecordingUrl('') }}
                                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-gray-500 hover:text-lime transition"
                                        >
                                            <Film className="h-3.5 w-3.5" />
                                            Add Recording
                                        </button>
                                    )}

                                    {/* Materials */}
                                    {Array.isArray(session.materials) && session.materials.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {session.materials.map((mat, i) => (
                                                <a
                                                    key={i}
                                                    href={mat.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-gray-300 bg-white/5 rounded-md border border-border hover:border-lime/30 transition"
                                                >
                                                    {mat.type === 'link' ? <LinkIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                    {mat.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => { setSelectedSession(session); setIsModalOpen(true) }}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-lime hover:bg-lime/5 transition"
                                        title="Edit session"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {confirmDeleteId === session.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(session)}
                                                className="px-2 py-1 text-[10px] font-medium rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-2 py-1 text-[10px] text-gray-500 hover:text-white transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(session)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition"
                                            title="Delete session"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <SessionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); setSelectedSession(null); onSessionsChange() }}
                cohortId={cohortId}
                session={selectedSession}
                defaultSessionNumber={nextSessionNumber}
            />
        </div>
    )
}
