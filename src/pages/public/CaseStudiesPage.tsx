import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import { CASE_STUDIES, WORKSHOPS, type CaseStudy } from '../../data/public-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '' }: {
    children: React.ReactNode; delay?: number; className?: string
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >{children}</motion.div>
    )
}

function MicroLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
    return <p className={`text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 ${center ? 'text-center' : ''}`}>{children}</p>
}

function LimeBar() {
    return (
        <motion.div initial={{ width: 0 }} whileInView={{ width: '4rem' }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime h-[2px] flex-shrink-0" style={{ width: '4rem' }} />
    )
}

// ─── Case Study Presentation ──────────────────────────────────────────────────

function CaseStudyPresentation({
    cs, slideIdx, onClose, onNext, onPrev, onJump,
}: {
    cs: CaseStudy
    slideIdx: number
    onClose: () => void
    onNext: () => void
    onPrev: () => void
    onJump: (i: number) => void
}) {
    const filmstripRef = useRef<HTMLDivElement>(null)
    const slide = cs.slides[slideIdx]

    useEffect(() => {
        const el = filmstripRef.current?.children[slideIdx] as HTMLElement
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [slideIdx])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext()
            if (e.key === 'ArrowLeft') onPrev()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onNext, onPrev, onClose])

    let lastCategory = ''

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
            onClick={onClose}
        >
            {/* Stop propagation on the actual content so only the bare backdrop closes */}
            <div className="flex flex-col flex-1 min-h-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-3 sm:px-5 pt-2.5 pb-0 bg-black shrink-0">
                <button onClick={onClose}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white text-white hover:text-black transition-all duration-200">
                    <X className="w-4 h-4" />
                </button>
                <div ref={filmstripRef} className="flex items-end gap-2 overflow-x-auto scrollbar-hide flex-1 py-1">
                    {cs.slides.map((s, i) => {
                        const isActive = i === slideIdx
                        const showDivider = s.category !== lastCategory && i > 0
                        const currentCategory = s.category
                        if (s.category !== lastCategory) lastCategory = s.category
                        return (
                            <div key={i} className="shrink-0 flex items-end gap-2">
                                {showDivider && <div className="w-px h-10 bg-white/[0.08] shrink-0" />}
                                <button
                                    onClick={() => onJump(i)}
                                    className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                                    title={`${currentCategory} — ${s.title}`}
                                >
                                    <div className={`w-14 h-9 rounded-lg overflow-hidden border-2 transition-colors duration-200 flex items-center justify-center bg-white/[0.04] ${isActive ? 'border-lime' : 'border-white/[0.06]'}`}>
                                        {s.vimeoId ? (
                                            <Play className="w-3.5 h-3.5 text-lime/80" />
                                        ) : (
                                            <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                    </div>
                                    <span className={`text-[0.5rem] uppercase tracking-wider font-bold tabular-nums ${isActive ? 'text-lime' : 'text-gray-600'}`}>{s.stepLabel}</span>
                                </button>
                            </div>
                        )
                    })}
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-[0.65rem] text-gray-600 tabular-nums">{slideIdx + 1} / {cs.slides.length}</p>
                    <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-700">{cs.name}</p>
                </div>
            </div>

            <div className="px-4 sm:px-8 py-3 border-b border-white/[0.07] bg-black shrink-0">
                <div className="max-w-4xl mx-auto flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-lime/80 font-bold mb-0.5">{slide.category}</p>
                        <p className="font-heading font-black uppercase text-lg sm:text-xl text-white leading-tight">{slide.title}</p>
                        {slide.caption && (
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">{slide.caption}</p>
                        )}
                    </div>
                    <div className="shrink-0 text-right hidden sm:block">
                        <p className="text-[0.65rem] text-gray-600 tabular-nums">{slideIdx + 1} / {cs.slides.length}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#060606] p-6 sm:p-10">
                <AnimatePresence mode="wait">
                    {slide.vimeoId ? (
                        <motion.div
                            key={`video-${slideIdx}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                <iframe
                                    src={`https://player.vimeo.com/video/${slide.vimeoId}?autoplay=1&loop=0&title=0&byline=0&portrait=0&color=c8f542`}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={slide.title}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.img
                            key={slideIdx}
                            src={slide.img}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="max-h-full max-w-full object-contain"
                            alt={slide.title}
                        />
                    )}
                </AnimatePresence>

                <button onClick={onPrev}
                    className={`absolute left-3 sm:left-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={onNext}
                    className={`absolute right-3 sm:right-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === cs.slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            </div>{/* /stopPropagation wrapper */}
        </motion.div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CaseStudiesPage() {
    const [caseStudyOpen, setCaseStudyOpen] = useState<string | null>(null)
    const [caseSlideIdx, setCaseSlideIdx] = useState(0)

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden selection:bg-lime/30">
            <PublicNav />

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section className="pt-36 pb-16 md:pt-44 md:pb-20 border-b border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '3rem' }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="h-[3px] bg-lime mb-5" />
                    <MicroLabel>Real work. Real output.</MicroLabel>
                    <h1 className="font-heading font-black uppercase text-[clamp(2.2rem,6vw,4.7rem)] leading-[0.92] mt-4">
                        <span className="block text-white">THIS IS WHAT</span>
                        <span className="block text-lime">AI DIRECTED</span>
                        <span className="block text-white">DESIGN LOOKS LIKE.</span>
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base mt-6 max-w-xl leading-relaxed">
                        Every image below was generated by AI. Click any project to open the full presentation.
                    </p>
                </div>
            </section>

            {/* ── CASE STUDIES GRID ───────────────────────────────────── */}
            <section className="py-16 md:py-24 bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {CASE_STUDIES.map((cs, idx) => (
                            <FadeIn key={cs.id} delay={idx * 0.06}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    onClick={() => { setCaseStudyOpen(cs.id); setCaseSlideIdx(0) }}
                                    className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-colors duration-300 group"
                                >
                                    <div className="flex h-60 sm:h-72 gap-[3px]">
                                        <div className="relative overflow-hidden flex-[2]">
                                            <img src={cs.previewImgs[0]} alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                        </div>
                                        <div className="flex flex-col flex-1 gap-[3px]">
                                            {cs.previewImgs.slice(1, 4).map((img, i) => (
                                                <div key={i} className="relative overflow-hidden flex-1 min-h-0">
                                                    <img src={img} alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-5 sm:px-6 py-4 flex items-center gap-4">
                                        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-lime/30 transition-colors duration-300">
                                            <img src={cs.dp} alt={cs.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-heading font-black uppercase text-base sm:text-lg text-white leading-tight">{cs.name}</h3>
                                            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-600 font-bold mt-0.5">{cs.role}</p>
                                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-1 max-w-sm">{cs.tagline}</p>
                                        </div>
                                        <div className="shrink-0 w-9 h-9 rounded-full border border-white/10 group-hover:border-lime/40 group-hover:bg-lime/10 transition-all flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-lime transition-colors" />
                                        </div>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIAL VIDEOS ──────────────────────────────────── */}
            <section className="py-16 md:py-24 border-t border-white/[0.04] bg-[#050505]">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
                    <FadeIn className="mb-12">
                        <MicroLabel>From the participants</MicroLabel>
                        <div className="flex flex-wrap items-end gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.95]">
                                HEAR FROM<br /><span className="text-lime">THE PEOPLE.</span>
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3">In their own words — unscripted.</p>
                    </FadeIn>

                    {/* Portrait video grid — 9:16 aspect ratio */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {WORKSHOPS.map((w, i) => (
                            <FadeIn key={w.id} delay={i * 0.04}>
                                <div
                                    className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/25 transition-colors duration-300"
                                    style={{ aspectRatio: '9/16' }}
                                >
                                    <iframe
                                        src={`https://player.vimeo.com/video/${w.id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title={w.label}
                                    />
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED AI FILMS ────────────────────────────────────── */}
            <section className="py-16 md:py-24 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
                    <FadeIn className="mb-12">
                        <MicroLabel>Fully AI-Generated</MicroLabel>
                        <div className="flex flex-wrap items-end gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.95]">
                                FEATURED<br /><span className="text-lime">AI FILMS.</span>
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3">Cinematic short films generated entirely with AI — no traditional production.</p>
                    </FadeIn>

                    <div className="space-y-6">
                        {/* F1 Film */}
                        <FadeIn delay={0.05}>
                            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/20 transition-colors duration-300">
                                <div className="aspect-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1187078968?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71"
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="F1 AI Film"
                                    />
                                </div>
                                <div className="px-5 py-4 flex items-center gap-4 border-t border-white/[0.05]">
                                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime border border-lime/20 bg-lime/5 px-2.5 py-1 rounded-full">Sports & Branding</span>
                                    <p className="font-heading font-black uppercase text-sm text-white">F1 Sprint — AI Campaign Film</p>
                                    <p className="text-xs text-gray-600 ml-auto hidden sm:block">Fully AI-generated · No production crew</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Atelier Carrousel Film */}
                        <FadeIn delay={0.1}>
                            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/20 transition-colors duration-300">
                                <div className="aspect-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1187090835?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71"
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="Atelier Carrousel AI Film"
                                    />
                                </div>
                                <div className="px-5 py-4 flex items-center gap-4 border-t border-white/[0.05]">
                                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime border border-lime/20 bg-lime/5 px-2.5 py-1 rounded-full">Luxury Brand</span>
                                    <p className="font-heading font-black uppercase text-sm text-white">Atelier Carrousel — AI Brand Film</p>
                                    <p className="text-xs text-gray-600 ml-auto hidden sm:block">Fully AI-generated · No studio</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* SOM Film */}
                        <FadeIn delay={0.15}>
                            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/20 transition-colors duration-300">
                                <div className="aspect-video">
                                    <iframe
                                        src="https://player.vimeo.com/video/1183148939?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71"
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="SOM AI Film"
                                    />
                                </div>
                                <div className="px-5 py-4 flex items-center gap-4 border-t border-white/[0.05]">
                                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime border border-lime/20 bg-lime/5 px-2.5 py-1 rounded-full">Architecture</span>
                                    <p className="font-heading font-black uppercase text-sm text-white">SOM — AI Architecture Film</p>
                                    <p className="text-xs text-gray-600 ml-auto hidden sm:block">Fully AI-generated · Skidmore Owings &amp; Merrill</p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────────── */}
            <section className="py-16 md:py-20 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl text-center">
                    <FadeIn>
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">Ready to create work like this?</p>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.93] mb-8">
                            THIS COULD BE<br /><span className="text-lime">YOUR PROJECT.</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="/find-your-path"
                                className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading">
                                Find Your Path <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="/masterclass-analytics"
                                className="group flex items-center gap-3 px-8 py-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/25 font-bold transition-all text-sm uppercase tracking-wider font-heading hover:-translate-y-0.5">
                                See the Program <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <PublicFooter />

            {/* ── CASE STUDY MODAL ────────────────────────────────────── */}
            <AnimatePresence>
                {caseStudyOpen && (() => {
                    const cs = CASE_STUDIES.find(c => c.id === caseStudyOpen)!
                    const nextSlide = () => setCaseSlideIdx(i => Math.min(i + 1, cs.slides.length - 1))
                    const prevSlide = () => setCaseSlideIdx(i => Math.max(i - 1, 0))
                    return (
                        <CaseStudyPresentation
                            cs={cs}
                            slideIdx={caseSlideIdx}
                            onClose={() => setCaseStudyOpen(null)}
                            onNext={nextSlide}
                            onPrev={prevSlide}
                            onJump={setCaseSlideIdx}
                        />
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}
