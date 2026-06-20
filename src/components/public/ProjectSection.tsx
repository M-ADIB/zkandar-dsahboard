import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { type ProjectCategory } from '@/data/public-data'

/* ─── Project Lightbox ──────────────────────────────────────────────────────── */

export function ProjectPresentation({
    project, startIdx, onClose,
}: {
    project: ProjectCategory
    startIdx: number
    onClose: () => void
}) {
    // Build slides: all images first, then optional film at the end
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
                img: '',
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

/* ── ProjectSection ────────────────────────────────────────────────────────── */

export function ProjectSection({ project }: { project: ProjectCategory }) {
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
                        <button onClick={() => setLightbox(0)} className="relative overflow-hidden flex-[2] group cursor-pointer w-full">
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
                                    <button key={i} onClick={() => setLightbox(i + 1)} className="relative flex-1 overflow-hidden group cursor-pointer min-h-0 w-full">
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
