import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import { CASE_STUDIES, WORKSHOPS, type CaseStudy, PROJECTS } from '../../data/public-data'

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



function LimeBar() {
    return (
        <motion.div initial={{ width: 0 }} whileInView={{ width: '4rem' }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime h-[2px] flex-shrink-0" style={{ width: '4rem' }} />
    )
}

import { ProjectSection } from '../../components/public/ProjectSection'

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
    const prevSlide = slideIdx > 0 ? cs.slides[slideIdx - 1] : null
    const nextSlide = slideIdx < cs.slides.length - 1 ? cs.slides[slideIdx + 1] : null

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
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* ── Top bar: caption + close ── */}
            <div className="px-4 sm:px-8 py-3 border-b border-white/[0.07] bg-black/80 backdrop-blur shrink-0">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-lime/80 font-bold mb-0.5">{slide.category}</p>
                        <p className="font-heading font-black uppercase text-lg sm:text-xl text-white leading-tight">{slide.title}</p>
                        {slide.caption && (
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{slide.caption}</p>
                        )}
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                        <p className="text-[0.65rem] text-gray-600 tabular-nums hidden sm:block">{slideIdx + 1} / {cs.slides.length}</p>
                        <button onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 hover:border-lime/50 hover:bg-lime/10 text-gray-200 hover:text-lime transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main image area with blurred prev/next ── */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#040404]"
                onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                {/* Blurred previous image (left edge) */}
                {prevSlide && prevSlide.img && (
                    <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={prevSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Blurred next image (right edge) */}
                {nextSlide && nextSlide.img && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={nextSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Main content */}
                <div className="relative z-[2] flex items-center justify-center w-full h-full p-4 sm:p-8 md:px-52"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
                    <AnimatePresence mode="wait">
                        {slide.vimeoId ? (
                            <motion.div
                                key={`video-${slideIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
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
                                className="max-h-full max-w-full object-contain rounded-lg"
                                alt={slide.title}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Prev arrow */}
                <button onClick={onPrev}
                    className={`absolute left-3 sm:left-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${slideIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-7 h-7" />
                </button>

                {/* Next arrow */}
                <button onClick={onNext}
                    className={`absolute right-3 sm:right-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${slideIdx === cs.slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* ── Timeline filmstrip (BELOW image) ── */}
            <div className="shrink-0 border-t border-white/[0.07] bg-black/80 backdrop-blur px-3 sm:px-5 py-3">
                <div ref={filmstripRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide mx-auto max-w-5xl py-1">
                    {cs.slides.map((s, i) => {
                        const isActive = i === slideIdx
                        const showDivider = s.category !== lastCategory && i > 0
                        const currentCategory = s.category
                        if (s.category !== lastCategory) lastCategory = s.category
                        return (
                            <div key={i} className="shrink-0 flex items-center gap-2">
                                {showDivider && (
                                    <div className="w-px h-10 bg-white/[0.08] shrink-0" />
                                )}
                                <button
                                    onClick={() => onJump(i)}
                                    className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                                    title={`${currentCategory}. ${s.title}`}
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
                <p className="text-center text-[0.6rem] uppercase tracking-[0.18em] text-gray-700 mt-2">{cs.name} · {cs.projectType}</p>
            </div>

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

            {/* Nav spacing */}
            <div className="pt-28" />

            {/* ── PAGE HEADING ─────────────────────────────────────── */}
            <section className="pt-6 pb-10 md:pb-14 bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 text-center">
                    <FadeIn>
                        <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-white">
                            Our <span className="text-lime">AI Works</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
                            Every image and film below was generated entirely with AI.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* ── PROJECT GALLERIES (from NotSurePage) ─────────────── */}
            <section className="py-10 md:py-14 bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 space-y-5">
                    {PROJECTS.map((project) => (
                        <ProjectSection key={project.id} project={project} />
                    ))}
                </div>
            </section>

            {/* Vitra film is now the first project in PROJECTS array above */}

            {/* ── CASE STUDIES GRID ───────────────────────────────────── */}
            <section className="py-16 md:py-24 bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
                    <FadeIn className="mb-12 text-center">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.95] text-white">
                            Participants' <span className="text-lime">Work</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">
                            Real projects created by our masterclass and sprint workshop participants using the workflows they learned.
                        </p>
                    </FadeIn>
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
                                        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/10 group-hover:border-lime/30 transition-colors duration-300">
                                            <img src={cs.dp} alt={cs.name} className="w-full h-full object-cover object-top" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-heading font-black uppercase text-base sm:text-lg text-white leading-tight">{cs.name}</h3>
                                            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-600 font-bold mt-0.5">{cs.role}</p>
                                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{cs.tagline}</p>
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
                    <FadeIn className="mb-12 text-center">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.95]">
                            HEAR FROM DESIGNERS WHO WENT<br /><span className="text-lime">BEYOND THE AI PROMPT</span>
                        </h2>
                        <div className="flex justify-center mt-4"><LimeBar /></div>
                    </FadeIn>

                    {/* Portrait video grid. 9:16 aspect ratio */}
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



            {/* ── FINAL CTA ────────────────────────────────────────── */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050F02] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(208,255,113,0.07)_0%,transparent_65%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime/30 to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 text-center">
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,3.4rem)] leading-[0.95] mb-6">
                        You've seen the proof.<br /><span className="text-lime">You already know.</span>
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.25 }}
                        className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
                        The doubt doesn't go away until you're in the room. Every person who came in unsure left with deliverables they used on a live project within minutes.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.35 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="/find-your-path"
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 hover:shadow-[0_0_40px_rgba(208,255,113,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                            Take the AI Assessment Test <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>

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
