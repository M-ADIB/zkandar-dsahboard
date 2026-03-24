import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Mail, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventRequest } from '@/types/database'
import { EventDetailDrawer } from '@/components/admin/events/EventDetailDrawer'

export function EventsPage() {
    const [events, setEvents] = useState<EventRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<'active' | 'done'>('active')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('event_requests')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setEvents(data || [])
        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEventUpdate = (updatedEvent: EventRequest) => {
        setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e))
        if (selectedEvent?.id === updatedEvent.id) {
            setSelectedEvent(updatedEvent)
        }
    }

    const activeStatuses = ['pending', 'approved', 'declined']

    const filteredEvents = events.filter(ev => {
        const matchesSearch =
            ev.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ev.event_type.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTab = activeTab === 'done' ? ev.status === 'done' : activeStatuses.includes(ev.status)
        const matchesStatus = statusFilter === 'all' || ev.status === statusFilter
        return matchesSearch && matchesTab && matchesStatus
    })

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pending' }
            case 'approved': return { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Approved' }
            case 'declined': return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Declined' }
            case 'done': return { bg: 'bg-sky-500/15', text: 'text-sky-400', label: 'Done' }
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-500', label: status }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Speaking Events</h1>
                    <p className="text-gray-400 text-sm mt-1">Review and manage book-Khaled requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open('/events-apply', '_blank')}
                        className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] text-white font-medium rounded-xl hover:border-lime/50 hover:text-lime transition-colors flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Request Form
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0A0A0A] border border-white/5 rounded-xl p-1 w-fit">
                {(['active', 'done'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setStatusFilter('all') }}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                            activeTab === tab
                                ? 'bg-[#1A1A1A] text-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab === 'active' ? 'Active' : 'Done'}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === tab ? 'bg-white/10 text-gray-300' : 'bg-white/5 text-gray-600'
                        }`}>
                            {tab === 'done'
                                ? events.filter(e => e.status === 'done').length
                                : events.filter(e => activeStatuses.includes(e.status)).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by company, name, or event title..."
                        className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-lime/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'active' && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            className="bg-[#111] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-lime/50 transition-colors cursor-pointer outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="declined">Declined</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Default Table */}
            <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-[#0A0A0A]">
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Details</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-48"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-6 bg-white/5 rounded-full w-24"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        No event requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((ev) => {
                                    const statusConfig = getStatusConfig(ev.status)
                                    return (
                                        <tr
                                            key={ev.id}
                                            className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                            onClick={() => {
                                                setSelectedEvent(ev)
                                                setIsDrawerOpen(true)
                                            }}
                                        >
                                            <td className="p-4">
                                                <div className="font-medium text-white">{ev.company}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white">{ev.full_name}</div>
                                                <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                    <Mail className="w-3 h-3" />
                                                    {ev.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white line-clamp-1">{ev.event_type}</div>
                                                <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {ev.venue}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {ev.proposed_date || 'TBD'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg inline-flex items-center justify-center transition-colors group-hover:text-brand-lime">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EventDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                event={selectedEvent}
                onUpdate={handleEventUpdate}
            />
        </div >
    )
}
