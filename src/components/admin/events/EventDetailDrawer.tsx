import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Users, Globe, Upload, Clock, Activity, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventRequest } from '@/types/database'

interface EventDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    event: EventRequest | null
    onUpdate: (event: EventRequest) => void
}

export function EventDetailDrawer({ isOpen, onClose, event, onUpdate }: EventDetailDrawerProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [adminNotes, setAdminNotes] = useState(event?.admin_notes || '')

    // Keep admin notes in sync when event changes
    useState(() => {
        setAdminNotes(event?.admin_notes || '')
    })

    if (!isOpen || !event) return null

    const handleStatusUpdate = async (newStatus: EventRequest['status']) => {
        setIsUpdating(true)
        try {
            // Update the status and admin notes in database
            const { data, error } = await supabase
                .from('event_requests')
                .update({ status: newStatus, admin_notes: adminNotes })
                .eq('id', event.id)
                .select()
                .single()

            if (error) throw error

            // Update parent component state
            onUpdate(data)

            // If status is approved or declined, trigger the email edge function
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
        } finally {
            setIsUpdating(false)
        }
    }

    const handleSaveNotes = async () => {
        setIsUpdating(true)
        try {
            const { data, error } = await supabase
                .from('event_requests')
                .update({ admin_notes: adminNotes })
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

    return (
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
                                value={event.status}
                                onChange={(e) => handleStatusUpdate(e.target.value as EventRequest['status'])}
                                disabled={isUpdating}
                                className={`outline-none px-4 py-2 rounded-xl text-sm font-semibold ${event.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                    event.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                        event.status === 'declined' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                                    }`}
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
                                    Changing status to "Approved" or "Declined" will automatically send a notification email to the requester.
                                </p>
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
                                        {!event.has_moderator && !event.has_qa && <div className="text-white text-sm">None</div>}
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
                                        <div className="text-sm text-gray-500 mb-2">Marketing Material / Flyer</div>
                                        <a href={event.marketing_flyer} target="_blank" rel="noreferrer" className="text-brand-lime text-sm hover:underline flex items-center gap-2">
                                            <Upload className="w-4 h-4" /> View Associated Link
                                        </a>
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
    )
}
