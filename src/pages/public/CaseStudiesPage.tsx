import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
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



function LimeBar() {
    return (
        <motion.div initial={{ width: 0 }} whileInView={{ width: '4rem' }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime h-[2px] flex-shrink-0" style={{ width: '4rem' }} />
    )
}

// ── Project Data ────────────────────────────────────────────────────────────

interface ProjectCategory {
    id: string
    tag: string
    title: string
    description: string
    images: string[]
    vimeoId?: string
    filmLabel?: string
}

const PROJECTS: ProjectCategory[] = [
    {
        id: 'vitra',
        tag: 'Interior Design',
        title: 'Vitra Showroom',
        description: 'Complete AI-directed interior visualization and cinematic brand film for the Vitra showroom experience.',
        images: [],
        vimeoId: '1188971702',
        filmLabel: 'Vitra Showroom AI Film',
    },
    {
        id: 'som',
        tag: 'Architecture',
        title: 'SOM x Skidmore Owings & Merrill',
        description: 'Full AI-directed architectural visualization, from an initial sketch to photorealistic renders and a cinematic brand film.',
        images: Array.from({ length: 36 }, (_, i) => `/more-works/som/${i + 1}.jpg`),
        vimeoId: '1187702968',
        filmLabel: 'SOM AI Architecture Film',
    },
    {
        id: 'f1',
        tag: 'Sports & Branding',
        title: 'F1 Sprint Campaign',
        description: 'Cinematic Formula 1 campaign imagery, entirely AI-generated. From race-day atmosphere to hero shots.',
        images: ['/more-works/f1/1.jpg','/more-works/f1/2.jpg','/more-works/f1/3.jpg','/more-works/f1/4.jpg'],
        vimeoId: '1187078968',
        filmLabel: 'F1 Sprint AI Campaign Film',
    },
    {
        id: 'atelier',
        tag: 'Luxury Brand',
        title: 'Atelier Carrousel',
        description: 'Product photography and cinematic brand identity, from opening scene to final product shot, no studio required.',
        images: ['/more-works/atelier-carrousel/opening.jpg','/more-works/atelier-carrousel/product-1.webp','/more-works/atelier-carrousel/product-2.webp','/more-works/atelier-carrousel/product-3.webp','/more-works/atelier-carrousel/closing.jpg'],
        vimeoId: '1187090835',
        filmLabel: 'Atelier Carrousel AI Brand Film',
    },
    {
        id: 'landscaping',
        tag: 'Landscape Architecture',
        title: 'Landscape Design',
        description: 'From a real phone camera photo of a site in Dubai to fully AI-generated landscape concepts. Every image after the first is entirely AI-generated.',
        images: [
            '/more-works/landscaping/0.jpg',
            '/more-works/landscaping/1.jpg','/more-works/landscaping/2.jpg','/more-works/landscaping/3.jpg',
            '/more-works/landscaping/4.jpg','/more-works/landscaping/5.jpg','/more-works/landscaping/6.jpg',
            '/more-works/landscaping/7.jpg','/more-works/landscaping/8.jpg','/more-works/landscaping/9.jpg',
            '/more-works/landscaping/10.jpg','/more-works/landscaping/11.jpg',
        ],
    },
    {
        id: 'product',
        tag: 'Product Design',
        title: 'Furniture Collection',
        description: 'From rough sketch to photorealistic product render. Each sketch is paired with its AI-generated output.',
        images: [
            '/more-works/product-design/sketch-1.png',
            '/more-works/product-design/1.jpg',
            '/more-works/product-design/sketch-2.png',
            '/more-works/product-design/2.jpg',
            '/more-works/product-design/sketch-3.png',
            '/more-works/product-design/3.jpg',
            '/more-works/product-design/4.jpg',
        ],
    },
    {
        id: 'coco',
        tag: 'Hospitality & Retail',
        title: 'Coco Chanel Concept',
        description: 'Cinematic hospitality scenes and retail visualization. AI-directed atmospheres at luxury brand standard.',
        images: ['/more-works/coco-chanel/1.jpg','/more-works/coco-chanel/2.jpg','/more-works/coco-chanel/3.jpg'],
        vimeoId: '1187667794',
        filmLabel: 'Coco Chanel Concept AI Brand Film',
    },
]

// ── Project Lightbox ────────────────────────────────────────────────────────

function ProjectPresentation({
    project, startIdx, onClose,
}: {
    project: ProjectCategory
    startIdx: number
    onClose: () => void
}) {
    // Build slides: all images first, then optional film at the end
    // Per-project image labels (e.g. real photos, sketch/render pairs)
    const IMAGE_LABELS: Record<string, Record<number, string>> = {
        landscaping: {
            0: 'Real Photo — Taken by Phone Camera',
            1: 'AI-Generated Concept 1', 2: 'AI-Generated Concept 2', 3: 'AI-Generated Concept 3',
            4: 'AI-Generated Concept 4', 5: 'AI-Generated Concept 5', 6: 'AI-Generated Concept 6',
            7: 'AI-Generated Concept 7', 8: 'AI-Generated Concept 8', 9: 'AI-Generated Concept 9',
            10: 'AI-Generated Concept 10', 11: 'AI-Generated Concept 11',
        },
        product: {
            0: 'Sketch 1', 1: 'AI Render of Sketch 1',
            2: 'Sketch 2', 3: 'AI Render of Sketch 2',
            4: 'Sketch 3', 5: 'AI Render of Sketch 3',
            6: 'Full Collection — All Components',
        },
    }
    const labelMap = IMAGE_LABELS[project.id] ?? {}

    const slides = useMemo(() => {
        const s: Array<{ type: 'image' | 'video'; img: string; label: string }> = project.images.map((img, i) => ({
            type: 'image' as const,
            img,
            label: labelMap[i] ?? `Image ${i + 1}`,
        }))
        if (project.vimeoId) {
            s.push({
                type: 'video' as const,
                img: '', // no thumbnail for video slide
                label: project.filmLabel ?? 'AI Film',
            })
        }
        return s
    }, [project, labelMap])

    const [idx, setIdx] = useState(startIdx)
    const filmstripRef = useRef<HTMLDivElement>(null)
    const slide = slides[idx]
    const prevSlide = idx > 0 ? slides[idx - 1] : null
    const nextSlide = idx < slides.length - 1 ? slides[idx + 1] : null

    const goNext = useCallback(() => setIdx(i => Math.min(i + 1, slides.length - 1)), [slides.length])
    const goPrev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), [])

    useEffect(() => {
        const el = filmstripRef.current?.children[idx] as HTMLElement
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [idx])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [goNext, goPrev, onClose])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* ── Top bar ── */}
            <div className="px-4 sm:px-8 py-3 border-b border-white/[0.07] bg-black/80 backdrop-blur shrink-0">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-lime/80 font-bold mb-0.5">{project.tag}</p>
                        <p className="font-heading font-black uppercase text-lg sm:text-xl text-white leading-tight">{project.title}</p>
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">{project.description}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                        <p className="text-[0.65rem] text-gray-600 tabular-nums hidden sm:block">{idx + 1} / {slides.length}</p>
                        <button onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 hover:border-lime/50 hover:bg-lime/10 text-gray-200 hover:text-lime transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main content area ── */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#040404]"
                onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                {/* Blurred previous (left edge) */}
                {prevSlide && prevSlide.img && (
                    <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={prevSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Blurred next (right edge) */}
                {nextSlide && nextSlide.img && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={nextSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Central content */}
                <div className="relative z-[2] flex items-center justify-center w-full h-full p-4 sm:p-8 md:px-52"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
                    <AnimatePresence mode="wait">
                        {slide.type === 'video' ? (
                            <motion.div
                                key={`video-${idx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                    <iframe
                                        src={`https://player.vimeo.com/video/${project.vimeoId}?autoplay=1&loop=0&title=0&byline=0&portrait=0&color=c8f542`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title={project.filmLabel ?? 'AI Film'}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.img
                                key={idx}
                                src={slide.img}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="max-h-full max-w-full object-contain rounded-lg"
                                alt={slide.label}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Prev arrow */}
                <button onClick={goPrev}
                    className={`absolute left-3 sm:left-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${idx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-7 h-7" />
                </button>

                {/* Next arrow */}
                <button onClick={goNext}
                    className={`absolute right-3 sm:right-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${idx === slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* ── Bottom filmstrip ── */}
            <div className="shrink-0 border-t border-white/[0.07] bg-black/80 backdrop-blur px-3 sm:px-5 py-3">
                <div ref={filmstripRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide mx-auto max-w-5xl py-1">
                    {slides.map((s, i) => {
                        const isActive = i === idx
                        return (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                            >
                                <div className={`w-14 h-9 rounded-lg overflow-hidden border-2 transition-colors duration-200 flex items-center justify-center bg-white/[0.04] ${isActive ? 'border-lime' : 'border-white/[0.06]'}`}>
                                    {s.type === 'video' ? (
                                        <Play className="w-3.5 h-3.5 text-lime/80" />
                                    ) : (
                                        <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                </div>
                                <span className={`text-[0.5rem] uppercase tracking-wider font-bold tabular-nums max-w-14 truncate ${isActive ? 'text-lime' : 'text-gray-600'}`}>
                                    {s.type === 'video' ? 'Film' : s.label.length <= 8 ? s.label : `${i + 1}`}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <p className="text-center text-[0.6rem] uppercase tracking-[0.18em] text-gray-700 mt-2">{project.title} · {project.tag}</p>
            </div>
        </motion.div>
    )
}

// ── ProjectSection ──────────────────────────────────────────────────────────

function ProjectSection({ project }: { project: ProjectCategory }) {
    const [lightbox, setLightbox] = useState<number | null>(null)
    const ref = useRef(null)
    const isVideoOnly = project.images.length === 0 && !!project.vimeoId
    const [featured, ...thumbs] = project.images

    // Special image labels for grid hover tooltips
    const GRID_LABELS: Record<string, Record<number, string>> = {
        landscaping: { 0: 'This image was taken in real life by a phone camera' },
        product: { 0: 'Sketch 1' },
    }
    const labelMap = GRID_LABELS[project.id] ?? {}

    return (
        <>
            <AnimatePresence>
                {lightbox !== null && (
                    <ProjectPresentation project={project} startIdx={lightbox} onClose={() => setLightbox(null)} />
                )}
            </AnimatePresence>

            <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.1] rounded-3xl overflow-hidden transition-colors duration-300">
                <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime border border-lime/20 bg-lime/5 px-2.5 py-1 rounded-full">{project.tag}</span>
                </div>

                {/* Video-only project (like Vitra) */}
                {isVideoOnly && project.vimeoId && (
                    <div className="mx-6 mb-4">
                        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                            <iframe src={`https://player.vimeo.com/video/${project.vimeoId}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={project.filmLabel ?? 'AI Film'} />
                        </div>
                        {project.filmLabel && <p className="text-xs text-gray-500 mt-2">{project.filmLabel} · Fully AI-generated</p>}
                    </div>
                )}

                {/* Image grid (non-video-only projects) */}
                {!isVideoOnly && project.images.length > 0 && (
                    <div className={`flex gap-[3px] ${project.images.length >= 4 ? 'h-72 sm:h-80' : 'h-64 sm:h-72'}`}>
                        <button onClick={() => setLightbox(0)} className="relative overflow-hidden flex-[2] group cursor-pointer">
                            <img src={featured} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-[0.6rem] uppercase tracking-wider text-white/80 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                                    {labelMap[0] ?? 'View Full'}
                                </span>
                            </div>
                        </button>
                        {thumbs.length > 0 && (
                            <div className="flex flex-col flex-1 gap-[3px]">
                                {thumbs.slice(0, 3).map((img, i) => (
                                    <button key={i} onClick={() => setLightbox(i + 1)} className="relative flex-1 overflow-hidden group cursor-pointer min-h-0">
                                        <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
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
                )}

                <div className="px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-black uppercase text-lg text-white leading-tight mb-1">{project.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-md">{project.description}</p>
                    </div>
                    {project.images.length > 0 && (
                        <button onClick={() => setLightbox(0)} className="shrink-0 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-lime font-bold hover:text-white transition-colors mt-0.5">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {project.images.length > 4 && (
                    <div className="px-6 pb-6 flex gap-2 overflow-x-auto scrollbar-hide">
                        {project.images.map((img, i) => (
                            <button key={i} onClick={() => setLightbox(i)} className="shrink-0 w-16 h-12 rounded-lg overflow-hidden border border-white/[0.06] hover:border-lime/30 transition-colors">
                                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}
                {!isVideoOnly && project.vimeoId && (
                    <div className="border-t border-white/[0.05] mx-6 mb-6 pt-5">
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime mb-3">AI Film Output</p>
                        <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                            <iframe src={`https://player.vimeo.com/video/${project.vimeoId}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={project.filmLabel ?? 'AI Film'} />
                        </div>
                        {project.filmLabel && <p className="text-xs text-gray-500 mt-2">{project.filmLabel} · Fully AI-generated</p>}
                    </div>
                )}
            </motion.div>
        </>
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
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">{slide.caption}</p>
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
                    <FadeIn className="mb-12 text-center">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4.2vw,3rem)] leading-[0.95]">
                            HEAR FROM<br /><span className="text-lime">OUR PARTICIPANTS</span>
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
