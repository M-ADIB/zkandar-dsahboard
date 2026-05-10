import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowRight, X, ChevronLeft, ChevronRight, Calendar, MapPin, Users } from 'lucide-react'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import { supabase } from '@/lib/supabase'

// ── Grain ────────────────────────────────────────────────────────────────
function GrainOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain-ev"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter="url(#grain-ev)" />
            </svg>
        </div>
    )
}

// ── Event Data ────────────────────────────────────────────────────────────

interface PastEvent {
    id: string
    title: string
    venue: string
    description: string
    images: string[]
    highlights?: string[]
}

const PAST_EVENTS: PastEvent[] = [
    {
        id: 'vitra',
        title: 'Vitra Showroom',
        venue: '300+ Attendees · Dubai',
        description: 'Headlined an immersive AI experience at the iconic Vitra Showroom for over 300 designers, architects, and industry leaders. The evening showcased live AI-directed design workflows, from initial concept to photorealistic visualization, demonstrating how AI is redefining the creative process for spatial design professionals. Attendees experienced firsthand how AI tools can be integrated into existing design practices to accelerate output without sacrificing creative control.',
        images: [
            '/collabs/events/vitra/1.jpg',
            '/collabs/events/vitra/2.jpg',
            '/collabs/events/vitra/3.jpg',
            '/collabs/events/vitra/4.jpg',
        ],
        highlights: ['300+ attendees', 'Live AI workflow demo', 'Industry-leading speakers'],
    },
    {
        id: 'designers-hub',
        title: 'Designers Hub',
        venue: 'Art of Living Mall · UAE',
        description: 'Headlined an engaging AI talk with 30+ business owners and award-winning design studios titled "How AI is Redefining Our Creative Process, Forever!" We explored how AI is reshaping storytelling, design workflows, and the future of creative leadership in the UAE.',
        images: ['/collabs/events/designers-hub/1.jpg'],
        highlights: ['30+ business owners', 'Award-winning studios', 'Creative leadership focus'],
    },
    {
        id: 'lau',
        title: 'Lebanese American University',
        venue: 'FF&E Webinar · Online',
        description: 'Invited as a guest speaker to 70+ participants consisting of Alumni, Business owners, students and fresh graduates, to speak about how AI is shifting the next paradigm in the design process whilst showcasing practical AI tools and applications on real life case studies.',
        images: ['/collabs/events/lau/1.jpg'],
        highlights: ['70+ participants', 'Alumni & students', 'Real-life case studies'],
    },
    {
        id: 'sikka',
        title: 'SIKKA',
        venue: 'Dubai Culture & Arts Authority · Dubai',
        description: 'Guest speaker for the "SIKKA" event hosted by Dubai Culture & Arts Authority. Engaged in the conversation of how AI can be of valuable use for Artists & Designers; Pros, Cons & Ethical Practices.',
        images: [
            '/collabs/events/sikka/1.jpg',
            '/collabs/events/sikka/2.jpg',
            '/collabs/events/sikka/3.jpg',
        ],
        highlights: ['Dubai Culture authority', 'Ethics in AI', 'Artists & designers'],
    },
    {
        id: 'lighting-institute',
        title: 'The Lighting Institute',
        venue: 'AI & Lighting Design · Dubai',
        description: 'Guest speaker hosted by "The Lighting Institute" titled "Designing for future spaces with the involvement of AI and its impact on lighting design." Joined by fellow guest speakers Prof. Kevin Mitchell & David Gilbey, moderated by Heba Hani.',
        images: [
            '/collabs/events/lighting-institute/1.jpg',
            '/collabs/events/lighting-institute/2.jpg',
        ],
        highlights: ['Expert panel', 'Lighting design focus', 'Future-forward spaces'],
    },
]

// ── Lightbox ──────────────────────────────────────────────────────────────

function Lightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
    const [idx, setIdx] = useState(startIdx)
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition z-10">
                <X className="w-4 h-4" />
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[0.6rem] uppercase tracking-[0.2em] text-gray-600 tabular-nums">
                {idx + 1} / {images.length}
            </div>
            <div className="relative w-full h-full flex items-center justify-center p-12" onClick={e => e.stopPropagation()}>
                <motion.img
                    key={idx} src={images[idx]}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="max-h-full max-w-full object-contain rounded-xl" alt=""
                />
                {idx > 0 && (
                    <button onClick={() => setIdx(i => i - 1)}
                        className="absolute left-3 sm:left-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {idx < images.length - 1 && (
                    <button onClick={() => setIdx(i => i + 1)}
                        className="absolute right-3 sm:right-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.div>
    )
}

// ── Upcoming Event from Supabase ──────────────────────────────────────────

interface UpcomingEvent {
    id: string
    title: string
    venue: string | null
    description: string | null
    event_date: string | null
    image_url: string | null
}

// ── Page ──────────────────────────────────────────────────────────────────

export function EventsCollabsPage() {
    const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null)
    const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([])

    useEffect(() => {
        supabase
            .from('events')
            .select('id, title, venue, description, event_date, image_url')
            .eq('status', 'upcoming')
            .order('event_date', { ascending: true })
            .then(({ data }) => {
                if (data) setUpcoming(data as UpcomingEvent[])
            })
    }, [])

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden selection:bg-lime/30">
            <GrainOverlay />
            <PublicNav topOffset={0} />

            {/* ── HERO ────────────────────────────────────────────────── */}
            <section className="relative pt-32 sm:pt-44 pb-16 text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] bg-[radial-gradient(ellipse,rgba(208,255,113,0.06)_0%,transparent_70%)] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6"
                >
                    <motion.div initial={{ width: 0 }} animate={{ width: '3rem' }} transition={{ duration: 0.8 }} className="h-[3px] bg-lime mb-6 mx-auto" />
                    <h1 className="font-heading font-black uppercase leading-[0.92] text-[clamp(2rem,5.2vw,3.8rem)] mb-5">
                        EVENTS &<br /><span className="text-lime">COLLABORATIONS</span>
                    </h1>
                    <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                        From intimate studio sessions to headlining talks with 300+ attendees. Here's where Zkandar AI has been sharing the future of design.
                    </p>
                </motion.div>
            </section>

            {/* ── UPCOMING EVENTS (from Supabase) ─────────────────────── */}
            {upcoming.length > 0 && (
                <section className="py-16 md:py-20 border-t border-white/[0.04] bg-[#050505]">
                    <div className="max-w-5xl mx-auto px-5 sm:px-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="inline-flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-lime font-body border border-lime/20 bg-lime/5 px-3 py-1.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                                    Upcoming
                                </span>
                            </div>
                            <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.8rem)] leading-[0.95] mb-10">
                                WHAT'S <span className="text-lime">NEXT.</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {upcoming.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-[#0a0a0a] border border-lime/10 rounded-2xl overflow-hidden hover:border-lime/25 transition-colors"
                                >
                                    {event.image_url && (
                                        <div className="aspect-[16/9] overflow-hidden">
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-6 space-y-3">
                                        <h3 className="font-heading font-black uppercase text-lg text-white">{event.title}</h3>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                            {event.event_date && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-lime" />
                                                    {new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            )}
                                            {event.venue && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-lime" />
                                                    {event.venue}
                                                </span>
                                            )}
                                        </div>
                                        {event.description && <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── PAST EVENTS ─────────────────────────────────────────── */}
            <section className="py-16 md:py-24 border-t border-white/[0.04] bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.8rem)] leading-[0.95] mb-3">
                            PAST <span className="text-lime">EVENTS.</span>
                        </h2>
                        <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                            Talks, workshops, and collaborations delivered across the UAE and beyond. Click any image to view full resolution.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        {PAST_EVENTS.map((event) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                                className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.1] rounded-3xl overflow-hidden transition-colors duration-300"
                            >
                                {/* Image grid */}
                                <div className={`flex gap-[3px] ${event.images.length >= 3 ? 'h-64 sm:h-80' : 'h-56 sm:h-72'}`}>
                                    <button
                                        onClick={() => setLightbox({ images: event.images, idx: 0 })}
                                        className={`relative overflow-hidden ${event.images.length > 1 ? 'flex-[2]' : 'flex-1'} group cursor-pointer`}
                                    >
                                        <img src={event.images[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-[0.6rem] uppercase tracking-wider text-white/80 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">View Full</span>
                                        </div>
                                    </button>
                                    {event.images.length > 1 && (
                                        <div className="flex flex-col flex-1 gap-[3px]">
                                            {event.images.slice(1, 4).map((img, i) => (
                                                <button key={i} onClick={() => setLightbox({ images: event.images, idx: i + 1 })}
                                                    className="relative flex-1 overflow-hidden group cursor-pointer min-h-0">
                                                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                                                    {i === 2 && event.images.length > 4 && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                            <span className="font-heading font-black text-white text-lg">+{event.images.length - 4}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="px-6 py-5 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-lime/70 font-body mb-1.5">{event.venue}</p>
                                            <h3 className="font-heading font-black uppercase text-xl text-white leading-tight mb-2">{event.title}</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{event.description}</p>
                                        </div>
                                        {event.images.length > 1 && (
                                            <button onClick={() => setLightbox({ images: event.images, idx: 0 })}
                                                className="shrink-0 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-lime font-bold hover:text-white transition-colors mt-0.5">
                                                View All <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Highlights */}
                                    {event.highlights && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
                                            {event.highlights.map(h => (
                                                <span key={h} className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-gray-500 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full">
                                                    <Users className="w-3 h-3" /> {h}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050F02] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(208,255,113,0.07)_0%,transparent_65%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime/30 to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 text-center">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,3.4rem)] leading-[0.95] mb-6">
                        WANT US AT<br /><span className="text-lime">YOUR EVENT?</span>
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.25 }}
                        className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
                        We bring live AI workflow demos, hands-on workshops, and keynote talks to design studios, festivals, and institutions worldwide.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.35 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="/events-apply"
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 hover:shadow-[0_0_40px_rgba(208,255,113,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                            Get In Touch <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <PublicFooter />

            {/* ── LIGHTBOX ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {lightbox && (
                    <Lightbox images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
