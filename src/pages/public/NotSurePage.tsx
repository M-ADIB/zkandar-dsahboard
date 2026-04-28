import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef } from 'react'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import { CalendlyModal } from '../../components/public/CalendlyModal'

// ── Grain ────────────────────────────────────────────────────────────────
function GrainOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain-ns"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter="url(#grain-ns)" />
            </svg>
        </div>
    )
}

function MicroLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
    return <p className={`text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 ${center ? 'text-center' : ''}`}>{children}</p>
}

// ── Data ─────────────────────────────────────────────────────────────────

const OUTCOMES = [
    { metric: '3 Days', label: 'Average time to first client-ready render', sub: 'vs 3–4 weeks traditional' },
    { metric: '8×', label: 'Faster concept iteration', sub: 'Sketch to photorealistic in minutes' },
    { metric: '100%', label: 'Used AI on a live project within 30 days', sub: 'Real deliverables, real clients' },
    { metric: '0', label: 'Prior AI experience required', sub: 'Built for designers, not engineers' },
]

const FAQS = [
    { q: "I'm not technical. Will I keep up?", a: "Every person in every cohort has said some version of this on day one. By day two, they're generating renders. We designed the Sprint specifically for architects and designers. Zero coding, zero machine learning. If you can describe a space, you can direct AI." },
    { q: "I've tried AI tools before and they weren't accurate enough.", a: "You were probably using generic tools. What we teach are workflows built specifically for architectural output. Correct proportions, material logic, spatial coherence. The gap between \"AI art\" and \"AI directed design\" is enormous. This is the latter." },
    { q: "What if I fall behind during the Sprint?", a: "The Sprint is intensive by design, but we keep cohorts small enough that no one gets left behind. Every session is recorded. You get async access to all materials." },
    { q: "I'm worried my clients won't trust AI-generated work.", a: "Your clients care about quality and speed. Not how it was made. The renders in our gallery? Clients approved them without knowing AI was involved. What matters is the output — and it's indistinguishable from traditional renders, often better." },
    { q: "Can I apply this to my actual projects, or is it all theory?", a: "Zero theory. By the end of day one you're running AI workflows on real briefs. By day three you leave with deliverables you can use immediately." },
]

// ── Project categories ────────────────────────────────────────────────────

interface ProjectCategory {
    id: string
    tag: string
    title: string
    description: string
    images: string[]
    vimeoId?: string
    filmLabel?: string
    color?: string
}

const PROJECTS: ProjectCategory[] = [
    {
        id: 'f1',
        tag: 'Sports & Branding',
        title: 'F1 Sprint Campaign',
        description: 'Cinematic Formula 1 campaign imagery — entirely AI-generated. From race-day atmosphere to hero shots.',
        images: [
            '/more-works/f1/1.jpg',
            '/more-works/f1/2.jpg',
            '/more-works/f1/3.jpg',
            '/more-works/f1/4.jpg',
        ],
        vimeoId: '1187078968',
        filmLabel: 'F1 Sprint — AI Campaign Film',
    },
    {
        id: 'landscaping',
        tag: 'Landscape Architecture',
        title: 'Landscape Design',
        description: 'From site plans to lush environmental renders — AI-generated landscaping at full client-presentation quality.',
        images: [
            '/more-works/landscaping/1.jpg',
            '/more-works/landscaping/2.jpg',
            '/more-works/landscaping/3.jpg',
            '/more-works/landscaping/4.jpg',
            '/more-works/landscaping/5.jpg',
            '/more-works/landscaping/6.jpg',
            '/more-works/landscaping/7.jpg',
            '/more-works/landscaping/8.jpg',
            '/more-works/landscaping/9.jpg',
            '/more-works/landscaping/10.jpg',
            '/more-works/landscaping/11.jpg',
        ],
    },
    {
        id: 'atelier',
        tag: 'Luxury Brand',
        title: 'Atelier Carrousel',
        description: 'Product photography and cinematic brand identity — from opening scene to final product shot, no studio required.',
        images: [
            '/more-works/atelier-carrousel/opening.jpg',
            '/more-works/atelier-carrousel/product-1.webp',
            '/more-works/atelier-carrousel/product-2.webp',
            '/more-works/atelier-carrousel/product-3.webp',
            '/more-works/atelier-carrousel/closing.jpg',
        ],
        vimeoId: '1187090835',
        filmLabel: 'Atelier Carrousel — AI Brand Film',
    },
    {
        id: 'coco',
        tag: 'Hospitality & Retail',
        title: 'Coco Chanel Concept',
        description: 'Cinematic hospitality scenes and retail visualization — AI-directed atmospheres at luxury brand standard.',
        images: [
            '/more-works/coco-chanel/1.jpg',
            '/more-works/coco-chanel/2.jpg',
            '/more-works/coco-chanel/3.jpg',
        ],
    },
    {
        id: 'product',
        tag: 'Product Design',
        title: 'Furniture Collection',
        description: 'From rough sketch to photorealistic product render — the full AI workflow, prize-winning output.',
        images: [
            '/more-works/product-design/sketch-1.png',
            '/more-works/product-design/sketch-2.png',
            '/more-works/product-design/1.jpg',
            '/more-works/product-design/2.jpg',
            '/more-works/product-design/3.jpg',
            '/more-works/product-design/4.jpg',
        ],
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
                    key={idx}
                    src={images[idx]}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="max-h-full max-w-full object-contain rounded-xl"
                    alt=""
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
            {/* Filmstrip */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto" onClick={e => e.stopPropagation()}>
                {images.map((img, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                        className={`shrink-0 w-12 h-8 rounded overflow-hidden border-2 transition-all ${i === idx ? 'border-lime opacity-100' : 'border-white/10 opacity-40 hover:opacity-70'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </motion.div>
    )
}

// ── Project Section ───────────────────────────────────────────────────────

function ProjectSection({ project, reverse: _reverse = false }: { project: ProjectCategory; reverse?: boolean }) {
    const [lightbox, setLightbox] = useState<number | null>(null)
    const ref = useRef(null)

    // Pick featured image + thumbnails
    const [featured, ...thumbs] = project.images

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <Lightbox images={project.images} startIdx={lightbox} onClose={() => setLightbox(null)} />
                )}
            </AnimatePresence>

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.1] rounded-3xl overflow-hidden transition-colors duration-300"
            >
                {/* Tag */}
                <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime border border-lime/20 bg-lime/5 px-2.5 py-1 rounded-full">{project.tag}</span>
                </div>

                {/* Main image grid */}
                <div className={`flex gap-[3px] ${project.images.length >= 4 ? 'h-72 sm:h-80' : 'h-64 sm:h-72'}`}>
                    {/* Featured (big) */}
                    <button
                        onClick={() => setLightbox(0)}
                        className="relative overflow-hidden flex-[2] group cursor-pointer"
                    >
                        <img src={featured} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-[0.6rem] uppercase tracking-wider text-white/80 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">View Full</span>
                        </div>
                    </button>

                    {/* Thumbnail stack */}
                    {thumbs.length > 0 && (
                        <div className="flex flex-col flex-1 gap-[3px]">
                            {thumbs.slice(0, 3).map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setLightbox(i + 1)}
                                    className="relative flex-1 overflow-hidden group cursor-pointer min-h-0"
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                                    {/* "+N more" badge on last visible thumb if there are hidden ones */}
                                    {i === 2 && thumbs.length > 3 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                            <span className="font-heading font-black text-white text-lg">+{thumbs.length - 3}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-black uppercase text-lg text-white leading-tight mb-1">{project.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-md">{project.description}</p>
                    </div>
                    <button
                        onClick={() => setLightbox(0)}
                        className="shrink-0 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-lime font-bold hover:text-white transition-colors mt-0.5"
                    >
                        View All <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                {/* All thumbnails strip if many images */}
                {project.images.length > 4 && (
                    <div className="px-6 pb-6 flex gap-2 overflow-x-auto scrollbar-hide">
                        {project.images.map((img, i) => (
                            <button key={i} onClick={() => setLightbox(i)}
                                className="shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-white/[0.06] hover:border-lime/30 transition-colors">
                                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}

                {/* AI Film embed — shown at the bottom of the card when a vimeoId exists */}
                {project.vimeoId && (
                    <div className="border-t border-white/[0.05] mx-6 mb-6 pt-5">
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime mb-3">AI Film Output</p>
                        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                            <iframe
                                src={`https://player.vimeo.com/video/${project.vimeoId}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={project.filmLabel ?? 'AI Film'}
                            />
                        </div>
                        {project.filmLabel && (
                            <p className="text-xs text-gray-500 mt-2">{project.filmLabel} · Fully AI-generated</p>
                        )}
                    </div>
                )}
            </motion.div>
        </>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function NotSurePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden selection:bg-lime/30">
            <GrainOverlay />
            <AnimatePresence>{modalOpen && <CalendlyModal onClose={() => setModalOpen(false)} />}</AnimatePresence>
            <PublicNav topOffset={0} />

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section className="relative pt-32 sm:pt-44 pb-16 text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] bg-[radial-gradient(ellipse,rgba(208,255,113,0.06)_0%,transparent_70%)] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6"
                >
                    <motion.div initial={{ width: 0 }} animate={{ width: '3rem' }} transition={{ duration: 0.8 }} className="h-[3px] bg-lime mb-6 mx-auto" />
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">Not sure yet</p>
                    <h1 className="font-heading font-black uppercase leading-[0.92] text-[clamp(2rem,5.2vw,3.8rem)] mb-5">
                        That's fair.<br /><span className="text-lime">Let the work speak.</span>
                    </h1>
                    <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                        Below is a fraction of what's possible. No studio. No 3D software. No outsourcing. Just AI, directed by people who learned in our program.
                    </p>
                </motion.div>
            </section>

            {/* ── OUTCOMES STRIP ────────────────────────────────────────── */}
            <div className="border-y border-white/[0.06] bg-white/[0.01]">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-white/[0.06]">
                    {OUTCOMES.map((o, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }} className="sm:px-6 text-center sm:text-left">
                            <div className="font-heading font-black text-3xl text-lime mb-1">{o.metric}</div>
                            <div className="text-sm font-semibold text-white leading-snug mb-1">{o.label}</div>
                            <div className="text-xs text-gray-500">{o.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── WHAT'S POSSIBLE HEADER ────────────────────────────────── */}
            <section className="pt-20 md:pt-28 pb-6 bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <MicroLabel>What's Possible</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.93] mt-4 mb-4">
                            THIS IS WHAT <span className="text-lime">AI-DIRECTED</span><br />DESIGN LOOKS LIKE.
                        </h2>
                        <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                            Every image below was generated by AI. No 3D modeling. No outsourced renders. Click any image to view full resolution.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── PROJECT GALLERIES ─────────────────────────────────────── */}
            <section className="py-10 md:py-14 bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 space-y-5">
                    {PROJECTS.map((project, i) => (
                        <ProjectSection key={project.id} project={project} reverse={i % 2 === 1} />
                    ))}
                </div>
            </section>

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <section className="py-16 md:py-24 border-t border-white/[0.04] bg-[#050505]">
                <div className="max-w-2xl mx-auto px-5 sm:px-6">
                    <div className="text-center mb-10">
                        <MicroLabel center>Still have doubts?</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.4vw,2.1rem)] leading-[0.95] mt-4">We've Heard All of Them.</h2>
                    </div>
                    <div className="space-y-2">
                        {FAQS.map((faq, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition"
                                >
                                    <span className="font-medium text-white text-sm leading-snug">{faq.q}</span>
                                    {openFaq === i
                                        ? <ChevronUp className="h-4 w-4 text-lime shrink-0" />
                                        : <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-5">
                                        <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050F02] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(208,255,113,0.07)_0%,transparent_65%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime/30 to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} className="flex justify-center mb-8">
                        <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lime border border-lime/25 bg-lime/[0.06] px-4 py-2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            Next Cohort Filling Fast
                        </span>
                    </motion.div>

                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,3.4rem)] leading-[0.95] mb-6">
                        You've seen what's possible.<br /><span className="text-lime">You already know.</span>
                    </motion.h2>

                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.25 }}
                        className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
                        The doubt doesn't go away until you're in the room. Every person who came in unsure left with deliverables they used on a live project within 30 days.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.35 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="https://buy.stripe.com/00wbJ10jzeCB3jGdfd1wY0M"
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 hover:shadow-[0_0_40px_rgba(208,255,113,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                            Direct Checkout <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <button onClick={() => setModalOpen(true)}
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:border-white/25 font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:-translate-y-0.5">
                            Book a Discovery Call <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>

                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.5 }}
                        className="text-[0.65rem] text-gray-700 uppercase tracking-[0.18em] mt-8">
                        No experience required · Output-first · Cohort spots limited
                    </motion.p>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────── */}
            <PublicFooter />
        </div>
    )
}
