import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Users, Globe, Clock, Activity, CheckCircle2, UtensilsCrossed, Car } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventRequest } from '@/types/database'
import { EPKGenerationDialog, EPKFormData } from './EPKGenerationDialog'

interface EventDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    event: EventRequest | null
    onUpdate: (event: EventRequest) => void
}

export function EventDetailDrawer({ isOpen, onClose, event, onUpdate }: EventDetailDrawerProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [adminNotes, setAdminNotes] = useState(event?.admin_notes || '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [surveyData, setSurveyData] = useState<any>(null)
    const [loadingSurvey, setLoadingSurvey] = useState(false)
    const [showEPKDialog, setShowEPKDialog] = useState(false)

    // Local status mirrors event.status; set to 'approved' immediately when user selects it
    // so the dropdown reflects the selection while the EPK dialog is open.
    const [localStatus, setLocalStatus] = useState<EventRequest['status']>(event?.status ?? 'pending')

    // Keep local status in sync when the event prop changes (e.g. after save)
    useEffect(() => {
        if (event?.status) setLocalStatus(event.status)
    }, [event?.status])

    // Keep admin notes in sync when event changes
    useState(() => {
        setAdminNotes(event?.admin_notes || '')
    })

    useEffect(() => {
        const fetchSurvey = async () => {
            if (!event?.email) return
            setLoadingSurvey(true)

            const [mgmt, team, post] = await Promise.all([
                supabase.from('management_submissions').select('*').eq('user_email', event.email).maybeSingle(),
                supabase.from('team_submissions').select('*').eq('user_email', event.email).maybeSingle(),
                supabase.from('post_completion_survey_responses').select('*').eq('respondent_email', event.email).maybeSingle()
            ])

            if (mgmt.data || team.data || post.data) {
                setSurveyData({
                    pre: mgmt.data || team.data,
                    preType: mgmt.data ? 'management' : team.data ? 'team' : null,
                    post: post.data
                })
            } else {
                setSurveyData(null)
            }
            setLoadingSurvey(false)
        }

        if (isOpen) {
            fetchSurvey()
        } else {
            setSurveyData(null)
        }
    }, [event, isOpen])

    if (!isOpen || !event) return null

    const handleStatusUpdate = async (newStatus: EventRequest['status']) => {
        setIsUpdating(true)
        try {
            const payload: any = { status: newStatus, admin_notes: adminNotes }
            const query: any = supabase.from('event_requests')
            const { data, error } = await query
                .update(payload)
                .eq('id', event.id)
                .select()
                .single()

            if (error) throw error

            onUpdate(data)

            if (newStatus === 'approved' || newStatus === 'declined') {
                await supabase.functions.invoke('send-event-email', {
                    body: {
                        eventId: event.id,
                        status: newStatus
                    }
                })
            }
        } catch (error) {
            console.error('Error updating event status:', error)
            alert('Failed to update status. Please try again.')
            // Reset dropdown to actual status on error
            setLocalStatus(event.status)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleStatusChange = (newStatus: EventRequest['status']) => {
        if (newStatus === 'approved' && event.status !== 'approved') {
            // Show EPK dialog before approving
            setLocalStatus('approved')
            setShowEPKDialog(true)
        } else {
            setLocalStatus(newStatus)
            handleStatusUpdate(newStatus)
        }
    }

    const handleEPKGenerateAndApprove = async (epkData: EPKFormData) => {
        setIsUpdating(true)
        try {
            const payload: any = {
                status: 'approved',
                admin_notes: adminNotes,
                ...epkData,
            }
            const query: any = supabase.from('event_requests')
            const { data, error } = await query
                .update(payload)
                .eq('id', event.id)
                .select()
                .single()

            if (error) throw error

            onUpdate(data)

            // Edge function reads epk_generated + epk_slug from the event record
            await supabase.functions.invoke('send-event-email', {
                body: { eventId: event.id, status: 'approved' }
            })

            setShowEPKDialog(false)
        } catch (error) {
            console.error('Error approving with EPK:', error)
            alert('Failed to approve. Please try again.')
            setLocalStatus(event.status)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleEPKApproveWithout = async () => {
        setShowEPKDialog(false)
        await handleStatusUpdate('approved')
    }

    const handleEPKCancel = () => {
        setShowEPKDialog(false)
        setLocalStatus(event.status)
    }

    const handleSaveNotes = async () => {
        setIsUpdating(true)
        try {
            const payload: any = { admin_notes: adminNotes }
            const query: any = supabase.from('event_requests')
            const { data, error } = await query
                .update(payload)
                .eq('id', event.id)
                .select()
                .single()

            if (error) throw error
            onUpdate(data)
        } catch (error) {
            console.error('Error saving notes:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const statusColorClass = localStatus === 'pending'
        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
        : localStatus === 'approved'
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : localStatus === 'declined'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-2xl bg-[#0B0B0B] border-l border-white/5 shadow-2xl flex flex-col h-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#111]">
                            <div>
                                <h2 className="text-xl font-bold text-white">{event.event_type}</h2>
                                <p className="text-gray-400 text-sm mt-1">{event.company}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={localStatus}
                                    onChange={(e) => handleStatusChange(e.target.value as EventRequest['status'])}
                                    disabled={isUpdating}
                                    className={`outline-none px-4 py-2 rounded-xl text-sm font-semibold ${statusColorClass}`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="declined">Declined</option>
                                    <option value="done">Done</option>
                                </select>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {/* Status Alert for Email Triggers */}
                            {event.status === 'pending' && (
                                <div className="p-4 bg-brand-lime/10 border border-brand-lime/20 rounded-xl">
                                    <p className="text-sm text-brand-lime flex items-start gap-2">
                                        <span className="shrink-0 mt-0.5">ℹ️</span>
                                        Changing status to "Approved" will open the EPK generation dialog before sending the confirmation email. "Declined" sends immediately.
                                    </p>
                                </div>
                            )}

                            {/* EPK badge if already generated */}
                            {event.epk_generated && event.epk_slug && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-[#D0FF71] uppercase tracking-wider mb-0.5">EPK Generated</p>
                                        <p className="text-sm text-gray-400 font-mono">
                                            /epk/{event.epk_slug}
                                        </p>
                                    </div>
                                    <a
                                        href={`/epk/${event.epk_slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#D0FF71] hover:underline"
                                    >
                                        View EPK →
                                    </a>
                                </div>
                            )}

                            {/* Contact Info */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Requester</div>
                                        <div className="text-white font-medium">{event.full_name}</div>
                                        <div className="text-gray-400 text-sm">{event.email}</div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Point of Contact</div>
                                        <div className="text-white font-medium">{event.contact_name}</div>
                                        <div className="text-gray-400 text-sm">{event.contact_phone}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Event Details */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Logistics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Calendar className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500">Proposed Date</div>
                                            <div className="text-white mt-1">{event.proposed_date || 'Flexible/TBD'}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <MapPin className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500">Location</div>
                                            <div className="text-white mt-1">{event.venue}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Users className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500">Audience Size</div>
                                            <div className="text-white mt-1 capitalize">{event.audience_size} people</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Globe className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500">Format</div>
                                            <div className="text-white mt-1 capitalize">{event.session_format}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Clock className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500">Duration</div>
                                            <div className="text-white mt-1">{event.duration}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                        <Activity className="w-5 h-5 text-brand-lime shrink-0" />
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="text-sm text-gray-500 mb-1">Requirements</div>
                                            {event.has_moderator && <div className="text-white text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-lime" /> Moderator needed</div>}
                                            {event.has_qa && <div className="text-white text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-lime" /> Dedicated Q&A</div>}
                                            {event.has_catering && <div className="text-white text-sm flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-brand-lime" /> Catering available</div>}
                                            {!event.has_moderator && !event.has_qa && !event.has_catering && <div className="text-white text-sm">None</div>}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Description</h3>
                                <div className="p-4 bg-[#111] border border-white/5 rounded-xl text-white whitespace-pre-wrap text-sm leading-relaxed">
                                    {event.event_description || 'No description provided.'}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Additional Info</h3>
                                <div className="space-y-4">
                                    {event.intro_handler && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                            <div className="text-sm text-gray-500 mb-2">Speaker Introduction</div>
                                            <div className="text-white text-sm">{event.intro_handler}</div>
                                        </div>
                                    )}

                                    {(event.available_tech && event.available_tech.length > 0) && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                            <div className="text-sm text-gray-500 mb-2">Available Tech</div>
                                            <div className="flex flex-wrap gap-2">
                                                {event.available_tech.map(tech => (
                                                    <span key={tech} className="px-3 py-1 bg-white/5 rounded-full text-xs text-brand-lime border border-white/10">{tech}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {event.marketing_flyer && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                            <div className="text-sm text-gray-500 mb-2">Marketing Flyer</div>
                                            <div className="text-white text-sm">{event.marketing_flyer}</div>
                                        </div>
                                    )}

                                    {event.parking_notes && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl flex gap-3">
                                            <Car className="w-5 h-5 text-brand-lime shrink-0" />
                                            <div>
                                                <div className="text-sm text-gray-500">Parking Instructions</div>
                                                <div className="text-white text-sm mt-1">{event.parking_notes}</div>
                                            </div>
                                        </div>
                                    )}

                                    {(event.vip_notes || event.other_notes) && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                            <div className="text-sm text-gray-500 mb-2">Extra Notes</div>
                                            <div className="text-white text-sm whitespace-pre-wrap">
                                                {event.vip_notes && <div><strong>VIP Notes:</strong> {event.vip_notes}</div>}
                                                {event.other_notes && <div className="mt-2"><strong>Other:</strong> {event.other_notes}</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Survey Data Section */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Survey Responses</h3>
                                {loadingSurvey ? (
                                    <div className="text-sm text-gray-500 animate-pulse">Loading survey data...</div>
                                ) : !surveyData ? (
                                    <div className="p-4 bg-[#111] border border-white/5 rounded-xl text-sm text-gray-500">
                                        No survey data found for {event.email}.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {surveyData.pre && (
                                            <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                                <div className="text-sm font-semibold text-brand-lime mb-3 flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    Pre-Program Survey ({surveyData.preType})
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(surveyData.pre)
                                                        .filter(([k]) => k.startsWith('q'))
                                                        .sort(([a], [b]) => {
                                                            const numA = parseInt(a.replace(/\D/g, '')) || 0
                                                            const numB = parseInt(b.replace(/\D/g, '')) || 0
                                                            return numA - numB
                                                        })
                                                        .map(([key, value]) => (
                                                            <div key={key}>
                                                                <div className="text-xs text-gray-500 mb-0.5 capitalize">{key.replace(/_/g, ' ')}</div>
                                                                <div className="text-sm text-white font-medium">
                                                                    {Array.isArray(value) ? value.join(', ') || '—' : String(value || '—')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                        {surveyData.post && (
                                            <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                                                <div className="text-sm font-semibold text-brand-lime mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Post-Program Survey
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {Object.entries((surveyData.post as any).answers || {}).map(([key, value]) => (
                                                        <div key={key}>
                                                            <div className="text-xs text-gray-500 mb-0.5 capitalize">{key.replace(/_/g, ' ')}</div>
                                                            <div className="text-sm text-white font-medium">
                                                                {Array.isArray(value) ? value.join(', ') || '—' : String(value || '—')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Admin Notes */}
                            <section className="pb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Internal Notes</h3>
                                    {adminNotes !== event.admin_notes && (
                                        <button
                                            onClick={handleSaveNotes}
                                            disabled={isUpdating}
                                            className="text-xs bg-brand-lime text-black font-semibold px-3 py-1 rounded-lg hover:bg-[#b5e55e] transition-colors"
                                        >
                                            {isUpdating ? 'Saving...' : 'Save Notes'}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes about this request..."
                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-lime/50 min-h-[120px] resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">These notes are only visible to admins.</p>
                            </section>

                            <div className="text-xs text-gray-500 text-center pb-4">
                                Requested on {new Date(event.created_at).toLocaleDateString()} at {new Date(event.created_at).toLocaleTimeString()}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {/* EPK dialog rendered via portal — not inside the animated drawer panel */}
            {showEPKDialog && (
                <EPKGenerationDialog
                    isOpen={showEPKDialog}
                    event={event}
                    onGenerateAndApprove={handleEPKGenerateAndApprove}
                    onApproveWithoutEPK={handleEPKApproveWithout}
                    onCancel={handleEPKCancel}
                />
            )}
        </>
    )
}
