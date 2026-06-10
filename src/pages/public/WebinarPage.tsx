import { useState, useEffect, useRef } from 'react'

import { Check, Play, ArrowRight, ChevronLeft, ChevronRight, X, Volume2 } from 'lucide-react'
// Nav/Footer intentionally removed
import { motion, AnimatePresence } from 'framer-motion'
import { trackFBEvent } from '@/lib/fbpixel'
import { WORKSHOPS, CASE_STUDIES, type CaseStudy } from '@/data/public-data'
import {
    FadeIn, Section, SectionHeading, SeatsCounter, CountdownTimer,
    CtaButton, ScarcityPricing, FaqItem,
    BeforeAfterSection, ValueTable, LeadCaptureModal,
} from '@/components/webinar/WebinarComponents'

/* ── Constants ─────────────────────────────────────────── */
const TARGET_DATE = new Date('2026-06-05T00:00:00+04:00') // First price increase: launch (May 29) + 7 days
const VSL_ID = '1187084528'
const TESTIMONIAL_MASHUP_ID = '1195125355'
const WEBINAR_DATE = new Date('2026-06-05T19:00:00+04:00') // 7 PM Dubai time

const FAQS = [
    { q: 'Do I need any AI experience to join?', a: 'If you\'ve never touched an AI tool, you\'ll be fine. If you\'ve been experimenting and hit a wall — that\'s exactly who this is for. We meet you where you are.' },
    { q: 'I already know how to prompt. Why do I need this?', a: 'That\'s exactly the point. Prompting is maybe 10% of the skill. This workshop covers the 90% nobody talks about — taste, direction, consistency, storytelling, and a complete workflow from sketch to client presentation.' },
    { q: 'What if I can\'t attend one of the days?', a: 'All sessions will be recorded and shared instantly after the webinar.' },
    { q: 'Is this only for interior designers?', a: 'Primarily, yes — and everyone else interested in knowing about these tools, because it\'s the same set of systems that they can apply to their workflows.' },
    { q: 'What tools will be covered?', a: 'We will cover all the necessary tools that are relevant to our design workflows that we will showcase to you.' },
    { q: 'Will I get a certificate?', a: 'Only participants who have registered for the Silver or Gold upgrade will receive a free AI certificate.' },
    { q: 'What\'s the schedule and time zone?', a: 'Two consecutive days at 7:00 PM Dubai time. Capped at 90 minutes per day.' },
    { q: 'Why is it only $19?', a: 'Because we\'ve seen what happens when designers stay stuck. We\'d rather price this so every serious designer can access it — and then let the results speak for themselves. The price goes up every week.' },
    { q: 'How do I access the sessions?', a: 'You will be onboarded onto our dashboard, where you will have access to the Zoom link.' },
]

const SCHEDULE = [
    {
        day: 'Day 1', date: 'June 5', title: 'The Gap: Where You Are vs. Where the Market Is',
        items: ['The AI reality check: who\'s actually using it, how, and what it\'s costing you to wait', 'The skill stack beyond the prompt: taste, visual literacy, judgment, and why they matter more than any tool'],
    },
    {
        day: 'Day 2', date: 'June 6', title: 'The Walkthrough: From Sketch to Complete Project',
        items: ['Live walkthrough: see how a rough sketch became a full concept — architecture, interiors, landscape, FF&E, marketing, and storytelling with video & animation', 'What you can achieve and why it matters — the full picture of AI-driven design at speed and quality'],
    },
]

/* ── Page Component ────────────────────────────────────── */
/* ── Inline Case Study Presentation ────────────────────── */
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
            {/* Top bar */}
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

            {/* Main image area */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#040404]"
                onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                {prevSlide && prevSlide.img && (
                    <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={prevSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}
                {nextSlide && nextSlide.img && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={nextSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}
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
                <button onClick={onPrev}
                    className={`absolute left-3 sm:left-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${slideIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <button onClick={onNext}
                    className={`absolute right-3 sm:right-6 z-[5] p-4 rounded-full bg-black/80 border-2 border-white/15 hover:border-lime/40 hover:bg-lime/10 text-white hover:text-lime transition-all backdrop-blur-sm ${slideIdx === cs.slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* Bottom filmstrip */}
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

/* ── Page Component ────────────────────────────────────── */
export default function WebinarPage() {
    // Dynamic seat counter: decays from 47 based on hours since page was built
    const [seats] = useState(() => {
        const launch = new Date('2026-05-29T00:00:00+04:00').getTime()
        const now = Date.now()
        const hoursPassed = Math.max(0, (now - launch) / (1000 * 60 * 60))
        return Math.max(7, 47 - Math.floor(hoursPassed * 0.3))
    })
    const [leadModalOpen, setLeadModalOpen] = useState(false)
    const [activeFaq, setActiveFaq] = useState<number | null>(null)
    const [vslPlaying, setVslPlaying] = useState(false)
    const [showStickyBar, setShowStickyBar] = useState(false)
    const heroRef = useRef<HTMLElement>(null)
    const [caseStudyOpen, setCaseStudyOpen] = useState<string | null>(null)
    const [caseSlideIdx, setCaseSlideIdx] = useState(0)

    useEffect(() => { trackFBEvent('ViewContent', { content_name: 'webinar_page' }) }, [])

    // Show sticky bar only after scrolling past the hero section
    useEffect(() => {
        const el = heroRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyBar(!entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const openCta = () => {
        trackFBEvent('Lead', { content_name: 'webinar_cta_click' })
        setLeadModalOpen(true)
    }


    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30 selection:text-black">

            {/* ═══ TOP PINNED BANNER ═══ */}
            <div className="fixed top-0 left-0 right-0 z-[110] bg-[#0A0A0A] border-b border-white/[0.08]">
                <div className="max-w-[64rem] mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
                        </span>
                        <span className="text-[0.65rem] sm:text-[0.7rem] font-body uppercase tracking-[0.15em] text-white font-bold">
                            <span className="text-lime">LIVE</span> WORKSHOP:
                        </span>
                        <span className="text-[0.65rem] sm:text-[0.7rem] font-body text-gray-300">
                            June 5–6, 2026 · 7:00 PM Dubai
                        </span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-white/[0.15]" />
                    <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] sm:text-[0.7rem] font-body uppercase tracking-[0.15em] text-gray-400 font-bold">STARTS IN:</span>
                        <CountdownTimer targetDate={WEBINAR_DATE} compact />
                    </div>
                </div>
            </div>

            {/* ═══ S1: HERO ═══ */}
            <section ref={heroRef} className="pt-24 pb-8 md:pt-28 md:pb-12">
                <div className="max-w-[52rem] mx-auto px-5 sm:px-8 text-center space-y-7">
                    <FadeIn delay={0.1}>
                        <h1 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,3rem)] leading-[0.93] tracking-[0.01em]">
                            BEYOND THE<br />
                            <span className="text-lime">AI PROMPT</span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-[0.95rem] md:text-lg text-gray-300 max-w-xl mx-auto leading-[1.75]">
                            Everyone can type a prompt. Almost nobody knows what to do next. We'll show you the exact system that turns a single sketch into a complete design project — at 10× the speed and a fraction of the cost.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.25}>
                        <div className="flex items-center justify-center gap-4 sm:gap-5 text-base sm:text-lg text-gray-300">
                            <span className="flex items-center gap-2"><Check className="w-4.5 h-4.5 text-lime" />Watch</span>
                            <span className="text-gray-700">·</span>
                            <span className="flex items-center gap-2"><Check className="w-4.5 h-4.5 text-lime" />Learn</span>
                            <span className="text-gray-700">·</span>
                            <span className="flex items-center gap-2"><Check className="w-4.5 h-4.5 text-lime" />Execute</span>
                        </div>
                        <p className="text-[0.8rem] text-gray-500 mt-3">For designers who already know AI exists — but haven't cracked the workflow yet</p>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ VSL Video Frame ═══ */}
            <section className="pb-6">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <FadeIn delay={0.3}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_0_80px_rgba(208,255,113,0.06)] bg-[#080808]">
                            {/* Top CTA bar */}
                            <div className="bg-[#111] border-b border-white/[0.08] px-4 py-3 flex items-center justify-center gap-2">
                                <Volume2 className="w-4 h-4 text-lime animate-pulse" />
                                <span className="text-[0.7rem] sm:text-[0.75rem] font-heading font-black uppercase tracking-[0.12em] text-white">
                                    CLICK BELOW TO WATCH FIRST!
                                </span>
                            </div>
                            {/* Video */}
                            <div className="relative aspect-video">
                                {!vslPlaying ? (
                                    <button onClick={() => setVslPlaying(true)} className="absolute inset-0 flex items-center justify-center group z-10">
                                        <img
                                            src={`https://vumbnail.com/${VSL_ID}.jpg`}
                                            alt="Watch the webinar intro"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="relative w-[4.5rem] h-[4.5rem] rounded-full bg-lime flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_50px_rgba(208,255,113,0.35)]">
                                            <Play className="w-7 h-7 text-black fill-black ml-0.5" />
                                        </div>
                                    </button>
                                ) : VSL_ID ? (
                                    <iframe
                                        src={`https://player.vimeo.com/video/${VSL_ID}?autoplay=1&title=0&byline=0&portrait=0&color=d0ff71`}
                                        className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm font-body">VSL Video — Set Vimeo ID</div>
                                )}
                            </div>
                            {/* Bottom countdown timer */}
                            <div className="bg-[#111] border-t border-white/[0.08] px-4 py-4 text-center space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
                                    </span>
                                    <span className="text-[0.6rem] sm:text-[0.65rem] font-body uppercase tracking-[0.18em] text-lime font-bold">LIVE</span>
                                </div>
                                <p className="text-[0.7rem] sm:text-[0.75rem] font-heading font-black uppercase tracking-[0.08em] text-lime">
                                    WORKSHOP STARTS IN
                                </p>
                                <CountdownTimer targetDate={WEBINAR_DATE} />
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ S2: PRIMARY CTA ═══ */}
            <Section>
                <FadeIn className="text-center space-y-8">
                    <CtaButton onClick={openCta} sub="See the workflow that turns one sketch into an entire project — from macro to micro" />
                    <SeatsCounter seats={seats} />
                </FadeIn>
            </Section>

            {/* ═══ S3: SCARCITY PRICING ═══ */}
            <Section dark>
                <FadeIn><ScarcityPricing onCta={openCta} /></FadeIn>
            </Section>

            {/* ═══ S4: TESTIMONIALS (Video Carousel) ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading>HEAR FROM DESIGNERS WHO WENT <span className="text-lime">BEYOND THE PROMPT</span></SectionHeading>
                </FadeIn>
                
                {/* 16:9 Testimonial Mashup Video */}
                <FadeIn delay={0.1} className="max-w-3xl mx-auto mb-10">
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_0_80px_rgba(208,255,113,0.06)] aspect-video bg-[#080808]">
                        <iframe
                            src={`https://player.vimeo.com/video/${TESTIMONIAL_MASHUP_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Testimonial Mashup"
                        />
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="relative overflow-hidden">
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-2 px-2">
                            {WORKSHOPS.map((w) => (
                                <div
                                    key={w.id}
                                    className="shrink-0 snap-center rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/25 transition-colors duration-300"
                                    style={{ width: '200px', aspectRatio: '9/16' }}
                                >
                                    <iframe
                                        src={`https://player.vimeo.com/video/${w.id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title={w.label}
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Fade edges */}
                        <div className="absolute top-0 left-0 bottom-4 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                        <div className="absolute top-0 right-0 bottom-4 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
                    </div>
                    <p className="text-center text-[0.6rem] text-gray-600 uppercase tracking-[0.15em] font-bold mt-3 md:hidden">Swipe to see more →</p>
                </FadeIn>
            </Section>

            {/* ═══ S5: WHAT YOU'LL LEARN (Case Studies) ═══ */}
            <Section dark>
                <FadeIn>
                    <SectionHeading sub="Every image below was generated by AI — not from a single prompt, but from a complete workflow. Real projects. Real participants. Zero stock imagery.">
                        THIS IS WHAT HAPPENS WHEN YOU GO<br /><span className="text-lime">BEYOND THE PROMPT</span>
                    </SectionHeading>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {CASE_STUDIES.map((cs) => (
                        <FadeIn key={cs.id}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                onClick={() => { setCaseStudyOpen(cs.id); setCaseSlideIdx(0) }}
                                className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-colors duration-300 group"
                            >
                                {/* Preview grid */}
                                <div className="flex h-52 sm:h-60 gap-[3px]">
                                    <div className="relative overflow-hidden flex-[2]">
                                        <img src={cs.previewImgs[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                    </div>
                                    <div className="flex flex-col flex-1 gap-[3px]">
                                        {cs.previewImgs.slice(1, 4).map((img, i) => (
                                            <div key={i} className="relative overflow-hidden flex-1 min-h-0">
                                                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Info row */}
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-white/10 group-hover:border-lime/30 transition-colors duration-300">
                                        <img src={cs.dp} alt={cs.name} className="w-full h-full object-cover object-top" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-heading font-black uppercase text-sm text-white leading-tight">{cs.name}</h3>
                                        <p className="text-[0.55rem] uppercase tracking-[0.15em] text-gray-600 font-bold mt-0.5">{cs.role}</p>
                                        <p className="text-[0.65rem] text-gray-500 mt-1 leading-relaxed line-clamp-1">{cs.tagline}</p>
                                    </div>
                                    <div className="shrink-0 w-8 h-8 rounded-full border border-white/10 group-hover:border-lime/40 group-hover:bg-lime/10 transition-all flex items-center justify-center">
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-lime transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* ═══ S6: MID-PAGE CTA ═══ */}
            <Section>
                <FadeIn className="text-center space-y-6">
                    <p className="text-[0.6rem] text-gray-600 uppercase tracking-[0.2em] font-bold">Early bird pricing ends soon</p>
                    <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.2rem)] leading-[0.93]">
                        YOUR COMPETITORS ARE ALREADY<br />
                        <span className="text-lime">DOING THIS WITHOUT YOU</span>
                    </h2>
                    <CtaButton onClick={openCta} size="md" />
                    <SeatsCounter seats={seats} className="mt-6" />
                </FadeIn>
            </Section>

            {/* ═══ S7: TARGET AUDIENCE ═══ */}
            <Section dark>
                <FadeIn>
                    <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-center">
                        <div className="space-y-7">
                            <SectionHeading center={false}>
                                IS THIS <span className="text-lime">FOR YOU?</span>
                            </SectionHeading>
                            <p className="text-[0.82rem] text-gray-400">Yes — if any of these sound like you:</p>
                            <ul className="space-y-3.5">
                                {[
                                    'You\'ve tried AI tools but hit a wall after the first image',
                                    'You know prompting isn\'t enough but don\'t know what\'s missing',
                                    'Your competitors are producing AI visuals that look better than yours',
                                    'Your clients have started showing YOU AI-generated images',
                                    'You want a system, not just a tool — from concept to client presentation',
                                    'You\'re ready to go from "I\'ve heard of it" to "I lead with it"',
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-[0.82rem] text-gray-300 leading-relaxed">
                                        <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />{item}
                                    </li>
                                ))}
                            </ul>
                            <CtaButton onClick={openCta} label="I'M READY TO GO BEYOND THE PROMPT" size="md" />
                        </div>
                        <div className="hidden md:block w-full">
                            <div className="rounded-2xl overflow-hidden border border-white/[0.08] aspect-[4/5] bg-[#111] relative group">
                                <img src="/casestudies/aleena/1.jpg" alt="AI Interior Design" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="text-[0.55rem] text-lime uppercase tracking-[0.2em] font-bold">AI-Generated Interior</span>
                                    <p className="text-[0.7rem] text-white/80 mt-1 leading-relaxed">Complete coffee bar concept generated entirely with AI — by one of our participants.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </Section>

            {/* ═══ S8: BENEFITS ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="This isn't a prompt tutorial. You'll see a complete design project executed live — from a rough sketch to a client-ready presentation — with AI integrated at every stage.">
                        WHAT EXACTLY WILL YOU <span className="text-lime">GAIN?</span>
                    </SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <ul className="space-y-4 max-w-xl mx-auto">
                        {[
                            'Why prompting alone hits a wall — and what the real skill stack is (**taste, visual literacy, storytelling**)',
                            'How to go from a **simple sketch** to a full design concept — architecture, interiors, wayfinding, customer journey',
                            'How to develop **consistent, fingerprint-level imagery** that looks like one cohesive project, not random AI outputs',
                            'How to **direct AI** toward the results you actually want — not just accept whatever it gives you',
                            'How to **storytell through your imagery** — from arrival experience to blow-up detail shots',
                            'How to turn **3 weeks of work into 3 hours** — across image generation, video, and marketing assets',
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-[0.82rem] text-gray-300 leading-relaxed">
                                <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                                <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10 text-center">
                        <CtaButton onClick={openCta} size="md" />
                    </div>
                </FadeIn>
            </Section>

            {/* ═══ S9: SCHEDULE ═══ */}
            <Section dark>
                <FadeIn>
                    <SectionHeading>THE <span className="text-lime">2-DAY</span> BREAKDOWN</SectionHeading>
                </FadeIn>
                <div className="grid md:grid-cols-2 gap-4">
                    {SCHEDULE.map((d, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 h-full hover:border-lime/10 transition-colors">
                                <p className="text-lime text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-1">{d.day} · {d.date}</p>
                                <h3 className="font-heading font-black uppercase text-[0.85rem] text-white mb-5 leading-snug">{d.title}</h3>
                                <div className="space-y-2.5">
                                    {d.items.map((item, j) => (
                                        <div key={j} className="bg-[#111] rounded-lg px-4 py-3 text-[0.78rem] text-gray-400 leading-relaxed">{item}</div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* ═══ S10: PERSUASION BRIDGE ═══ */}
            <Section>
                <FadeIn className="text-center space-y-5">
                    <p className="text-sm text-gray-600 italic">Here's the thing nobody talks about…</p>
                    <p className="text-[0.95rem] text-gray-300 leading-[1.75] max-w-lg mx-auto">
                        Every designer can type a prompt. That's not the skill. The skill is what happens BEFORE the prompt — and what happens AFTER. It's the taste. The visual literacy. The judgment to know what's good. It's knowing how to take one image and turn it into
                    </p>
                    <p className="text-lime font-heading font-black text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none">AN ENTIRE PROJECT</p>
                    <p className="text-[0.95rem] text-gray-300 max-w-lg mx-auto leading-relaxed">from macro to micro — architecture, interiors, wayfinding, arrival experience, blow-up shots — all at fingerprint-level quality that looks nothing like anyone else's work.</p>
                    <p className="text-[0.8rem] text-gray-500 max-w-md mx-auto">4 years of real-world AI experience in the design industry — compressed into a 3-hour webinar.</p>
                    <div className="pt-4"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
            </Section>

            {/* ═══ S11: INSTRUCTOR BIO ═══ */}
            <Section dark>
                <FadeIn>
                    <SectionHeading>
                        ABOUT <span className="text-lime">US.</span>
                    </SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <div className="max-w-5xl mx-auto grid md:grid-cols-[auto_1.6fr] gap-10 md:gap-16 items-stretch">
                        {/* Portrait with name overlay */}
                        <div className="flex flex-col items-center md:items-start">
                            <div className="relative w-64 md:w-72 rounded-2xl overflow-hidden border border-white/[0.08] h-full min-h-[28rem]">
                                <img
                                    src="/bio-khaled-portrait.jpg"
                                    alt="Khaled Iskandar"
                                    className="w-full h-full object-cover object-top scale-[1.43] translate-y-[5%]"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-5 px-5">
                                    <h3 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,2.4rem)] leading-[0.92] text-white">
                                        KHALED<br /><span className="text-lime">ISKANDAR.</span>
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Bio text */}
                        <div className="flex flex-col justify-center">
                            <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300 mb-6">
                                Architect and Interior Designer turned AI Workflow Strategist. For the past 4 years, Khaled has been in the trenches — taking daily calls with award-winning studios, understanding exactly where designers get stuck with AI, and building the systems that get them unstuck.
                            </p>
                            <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300 mb-8">
                                What he discovered: everyone hits the same wall. They generate one image, maybe two, and then have no idea where to go. The prompt isn't the problem. The gap is everything that comes before it — taste, visual literacy, design judgment — and everything that comes after it — consistency, storytelling, iteration, and presentation.
                            </p>
                            <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300">
                                His work has led him to headline talks and workshops for <span className="text-white font-semibold">Skidmore, Owings &amp; Merrill</span>, <span className="text-white font-semibold">LW Design Group</span>, <span className="text-white font-semibold">Sikka Art &amp; Design Festival</span>, and <span className="text-white font-semibold">Dubai Institute of Design and Innovation</span>, among others. He built this workshop to close the exact gap he sees in every call.
                            </p>
                        </div>
                    </div>
                    <div className="mt-10 text-center"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
            </Section>


            {/* ═══ S12: VALUE STACKING ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="You're not just watching a webinar. You're getting the complete system:">
                        WHAT YOU GET<br /><span className="text-lime">WHEN YOU REGISTER</span>
                    </SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}><ValueTable /></FadeIn>
                <FadeIn delay={0.2} className="text-center mt-12 space-y-5">
                    <p className="text-[0.85rem] text-gray-400">But because our goal is to reach as many ambitious designers as possible…</p>
                    <p className="text-2xl font-heading font-black">You can join now for just <span className="text-lime">$19</span></p>
                    <CtaButton onClick={openCta} size="md" />
                </FadeIn>
            </Section>

            {/* ═══ S13: BEFORE / AFTER ═══ */}
            <Section dark>
                <FadeIn><BeforeAfterSection onCta={openCta} /></FadeIn>
            </Section>



            {/* ═══ S15: FAQ ═══ */}
            <Section dark>
                <FadeIn>
                    <SectionHeading>FREQUENTLY ASKED <span className="text-lime">QUESTIONS</span></SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <div className="max-w-xl mx-auto">
                        {FAQS.map((faq, i) => (
                            <FaqItem key={i} q={faq.q} a={faq.a} open={activeFaq === i} onToggle={() => setActiveFaq(activeFaq === i ? null : i)} />
                        ))}
                    </div>
                </FadeIn>
            </Section>


            {/* ═══ S16: FINAL CTA ═══ */}
            <Section className="pb-32">
                <FadeIn className="text-center space-y-6">
                    <h2 className="font-heading font-black uppercase text-[clamp(1.6rem,4.5vw,3rem)] leading-[0.93]">
                        STOP PROMPTING.<br /><span className="text-lime">START DIRECTING.</span>
                    </h2>

                    <div className="pt-2"><CtaButton onClick={openCta} /></div>
                    <SeatsCounter seats={seats} className="mt-6" />
                </FadeIn>
            </Section>

            {/* ═══ STICKY BOTTOM BAR ═══ */}
            <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06] transition-transform duration-300 ease-out ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-[52rem] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                        onClick={openCta}
                        className="w-full sm:w-auto bg-lime text-black font-heading font-black uppercase text-[0.8rem] px-8 py-3 rounded-full hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] transition-all tracking-[0.04em]"
                    >
                        GO BEYOND THE PROMPT · $19
                    </button>
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                            </span>
                            <span className="text-[0.55rem] text-gray-500 uppercase tracking-[0.15em] font-bold">Price increase</span>
                        </span>
                        <CountdownTimer targetDate={TARGET_DATE} compact />
                    </div>
                </div>
            </div>

            {/* Bottom spacer for sticky bar */}
            <div className="h-20" />

            {/* Minimal footer — no nav distractions */}
            <div className="border-t border-white/[0.04] py-6 text-center text-[0.6rem] text-gray-700">
                <p>© {new Date().getFullYear()} Zkandar AI · All rights reserved · <a href="/terms" className="underline hover:text-gray-500">Terms</a></p>
            </div>

            {/* ═══ LEAD CAPTURE MODAL ═══ */}
            <LeadCaptureModal
                open={leadModalOpen}
                onClose={() => setLeadModalOpen(false)}
            />

            {/* ═══ CASE STUDY MODAL ═══ */}
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
