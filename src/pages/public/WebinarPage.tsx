import { useState, useEffect, useRef } from 'react'

import { Check, Play, ArrowRight } from 'lucide-react'
// Nav/Footer intentionally removed
import { motion } from 'framer-motion'
import { trackFBEvent } from '@/lib/fbpixel'
import logoSrc from '@/assets/logo.png'
import { WORKSHOPS, CASE_STUDIES } from '@/data/public-data'
import {
    FadeIn, Section, SectionHeading, SeatsCounter, CountdownTimer,
    CtaButton, ScarcityPricing, FaqItem,
    BeforeAfterSection, ValueTable, GuaranteeBadge, LeadCaptureModal,
} from '@/components/webinar/WebinarComponents'

/* ── Constants ─────────────────────────────────────────── */
const TARGET_DATE = new Date('2026-06-05T00:00:00+04:00') // First price increase: launch (May 29) + 7 days
const VSL_ID = '1187084528'
const TESTIMONIAL_MASHUP_ID = '1195125355'

const FAQS = [
    { q: 'Do I need any AI experience to join?', a: 'No. This webinar is designed for all levels, whether you\'ve never touched an AI tool or you\'ve been experimenting on your own.' },
    { q: 'What if I can\'t attend one of the 3 days?', a: 'All sessions will be recorded and shared with registered participants within 24 hours.' },
    { q: 'Is this only for interior designers?', a: 'Primarily yes, but architects, product designers, and anyone in the built environment will benefit greatly.' },
    { q: 'What tools will be covered?', a: 'We\'ll cover AI tools relevant to the design workflow, including Midjourney, ChatGPT, and project management frameworks. No paid subscriptions required during the event.' },
    { q: 'Will I get a certificate?', a: 'Yes. Participants who attend all 3 sessions and complete the post-event assignment will receive a Zkandar AI certificate.' },
    { q: 'What\'s the schedule and time zone?', a: 'The webinar runs over 3 consecutive days at 6:00 PM GST (Dubai time). Each day is approximately 2 hours.' },
    { q: 'Why is it so affordable?', a: 'We want this knowledge to reach as many designers as possible. The early-bird price is our way of rewarding fast action. It won\'t last.' },
    { q: 'How do I access the sessions?', a: 'You\'ll receive a Zoom link via email after registration. All you need is a stable internet connection.' },
]

const SCHEDULE = [
    {
        day: 'Day 1', date: 'June 5', title: 'Project Briefing & Visual Identity',
        items: ['Understanding client needs & translating them into a design vision', 'Designing the Concept and developing the Moodboard'],
    },
    {
        day: 'Day 2', date: 'June 6', title: 'From Concept to Complete Project',
        items: ['Creating the project presentation video', 'Using AI tools to accelerate idea development'],
    },
    {
        day: 'Day 3', date: 'June 7', title: 'Project Development & Marketing',
        items: ['Project review and final adjustments, practical session', 'Using AI to develop and refine projects'],
    },
]

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


            {/* ═══ S1: HERO ═══ */}
            <section ref={heroRef} className="pt-16 pb-8 md:pt-20 md:pb-12">
                <div className="max-w-[52rem] mx-auto px-5 sm:px-8 text-center space-y-7">
                    <FadeIn>
                        <img src={logoSrc} alt="Zkandar" className="h-7 mx-auto opacity-50" />
                    </FadeIn>
                    <FadeIn delay={0.05}>
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 font-bold">
                            June 5–7, 2026 · 6:00 PM GST · Live on Zoom
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h1 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,3rem)] leading-[0.93] tracking-[0.01em]">
                            THE SECRET BEHIND<br />DESIGNING PROJECTS<br />
                            <span className="text-lime">10× FASTER</span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-[0.95rem] md:text-lg text-gray-300 max-w-xl mx-auto leading-[1.75]">
                            We'll share our exact AI workflow system for interior design projects, from initial concept to client presentation, step by step.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.25}>
                        <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime" />Attend</span>
                            <span className="text-gray-700">·</span>
                            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime" />Learn</span>
                            <span className="text-gray-700">·</span>
                            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime" />Execute</span>
                        </div>
                        <p className="text-[0.7rem] text-gray-600 mt-2">Suitable for all levels, from beginner to advanced</p>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ VSL Video ═══ */}
            <section className="pb-6">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <FadeIn delay={0.3}>
                        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_0_80px_rgba(208,255,113,0.06)] aspect-video bg-[#080808]">
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
                    </FadeIn>
                </div>
            </section>

            {/* ═══ S2: PRIMARY CTA ═══ */}
            <Section>
                <FadeIn className="text-center space-y-8">
                    <CtaButton onClick={openCta} sub="Discover how AI can transform every stage of your design projects" />
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
                    <SectionHeading>HEAR FROM <span className="text-lime">OUR PARTICIPANTS</span></SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <div className="relative overflow-hidden">
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-2 px-2">
                            {/* Testimonial mashup hero video */}
                            <div
                                className="shrink-0 snap-center rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] hover:border-lime/25 transition-colors duration-300"
                                style={{ width: '200px', aspectRatio: '9/16' }}
                            >
                                <iframe
                                    src={`https://player.vimeo.com/video/${TESTIMONIAL_MASHUP_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title="Testimonial Mashup"
                                    loading="lazy"
                                />
                            </div>
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
                    <SectionHeading sub="Every image below was generated by AI. These are real projects by real participants.">
                        WHAT YOU'LL<br /><span className="text-lime">LEARN TO DO</span>
                    </SectionHeading>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {CASE_STUDIES.map((cs) => (
                        <FadeIn key={cs.id}>
                            <motion.a
                                href={`/case-studies#${cs.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -4 }}
                                className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-colors duration-300 group block"
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
                            </motion.a>
                        </FadeIn>
                    ))}
                </div>
            </Section>

            {/* ═══ S6: MID-PAGE CTA ═══ */}
            <Section>
                <FadeIn className="text-center space-y-6">
                    <p className="text-[0.6rem] text-gray-600 uppercase tracking-[0.2em] font-bold">Offer ends: June 1, 2026</p>
                    <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.2rem)] leading-[0.93]">
                        REGISTER NOW AND<br />
                        DISCOVER THE SECRET OF THE MOST <span className="text-lime">SUCCESSFUL DESIGNERS</span>
                    </h2>
                    <CtaButton onClick={openCta} size="md" />
                    <SeatsCounter seats={seats} className="mt-6" />
                </FadeIn>
            </Section>

            {/* ═══ S7: TARGET AUDIENCE ═══ */}
            <Section dark>
                <FadeIn>
                    <div className="grid md:grid-cols-[1fr_280px] gap-12 items-start">
                        <div className="space-y-7">
                            <SectionHeading center={false}>
                                IS THIS <span className="text-lime">FOR YOU?</span>
                            </SectionHeading>
                            <p className="text-[0.82rem] text-gray-400">Yes, if you are:</p>
                            <ul className="space-y-3.5">
                                {[
                                    'An interior designer wanting to cut project execution time in half',
                                    'An architect looking to visualize concepts faster with AI',
                                    'A marketer in the design industry who needs stunning visuals on demand',
                                    'A design studio owner modernizing their team\'s workflow with AI',
                                    'A freelancer looking for a system to deliver projects faster',
                                    'An ambitious professional who invests in themselves',
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-[0.82rem] text-gray-300 leading-relaxed">
                                        <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />{item}
                                    </li>
                                ))}
                            </ul>
                            <CtaButton onClick={openCta} label="INVEST IN YOURSELF. BOOK MY SEAT" size="md" />
                        </div>
                        <div className="hidden md:grid grid-cols-2 gap-2 w-full">
                            {[
                                { img: '/casestudies/aleena/1.jpg', label: 'AI Interior Concept' },
                                { img: '/casestudies/akshay/2.jpg', label: 'AI Product Render' },
                                { img: '/casestudies/nancy/3.jpg', label: 'AI Visualization' },
                                { img: '/casestudies/sultan/1.jpg', label: 'AI Presentation' },
                            ].map((p, i) => (
                                <div key={i} className="rounded-xl overflow-hidden border border-white/[0.08] aspect-square bg-[#111] relative group">
                                    <img src={p.img} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <span className="absolute bottom-2 left-2 text-[0.5rem] text-white/80 uppercase tracking-[0.15em] font-bold">{p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </Section>

            {/* ═══ S8: BENEFITS ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="You'll see a complete interior design project executed with AI integrated at every stage, from the initial idea to the final client presentation.">
                        WHAT EXACTLY WILL YOU <span className="text-lime">GAIN?</span>
                    </SectionHeading>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <ul className="space-y-4 max-w-xl mx-auto">
                        {[
                            'How to understand client needs and translate them into a clear **Design Concept**',
                            'How to build a **Moodboard** that reflects the project\'s visual identity',
                            'How to use **AI** to accelerate idea development and visual presentations',
                            'How to take a project from initial concept to client-ready presentation',
                            'How to present your project professionally to help clients decide',
                            'How to market your project and tell its story compellingly',
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
                    <SectionHeading>THE <span className="text-lime">3-DAY</span> SCHEDULE</SectionHeading>
                </FadeIn>
                <div className="grid md:grid-cols-3 gap-4">
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
                    <p className="text-sm text-gray-600 italic">It's not a secret…</p>
                    <p className="text-[0.95rem] text-gray-300 leading-[1.75] max-w-lg mx-auto">
                        If you learn how to integrate AI into every stage of your design process, you'll discover a new level of speed and execution, up to
                    </p>
                    <p className="text-lime font-heading font-black text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none">10× Faster</p>
                    <p className="text-[0.95rem] text-gray-300 max-w-lg mx-auto leading-relaxed">than traditional methods. More projects, higher income, real control over your future.</p>
                    <p className="text-[0.8rem] text-gray-500 max-w-md mx-auto">This is exactly what we've learned over 15 years, and we built this webinar to share it with you in just 6 hours.</p>
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
                                    className="w-full h-full object-cover object-top scale-[1.3] translate-y-[5%]"
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
                                Architect and Interior Designer turned AI Educator and Workflow Strategist, educating architects, interior designers, and marketers on how to rethink the way ideas are created, developed, and presented through AI-driven workflows.
                            </p>
                            <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300 mb-8">
                                As the founder of an AI EdTech company, he has spent the past five years leading Masterclasses and tailored AI integrations for award-winning design studios, while building a strong global presence as a thought leader in AI for the creative industry.
                            </p>
                            <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300">
                                His work has led him to headline talks and workshops for firms and institutions including <span className="text-white font-semibold">Skidmore, Owings &amp; Merrill</span>, <span className="text-white font-semibold">LW Design Group</span>, <span className="text-white font-semibold">Sikka Art &amp; Design Festival</span>, and <span className="text-white font-semibold">Dubai Institute of Design and Innovation</span>, among others.
                            </p>
                        </div>
                    </div>
                    <div className="mt-10 text-center"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
            </Section>


            {/* ═══ S12: VALUE STACKING ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="You're not just attending sessions. You're getting a complete toolkit:">
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

            {/* ═══ S14: GUARANTEE ═══ */}
            <Section>
                <FadeIn className="max-w-lg mx-auto">
                    <div className="border border-lime/[0.15] bg-lime/[0.02] rounded-2xl p-8 md:p-10 text-center">
                        <GuaranteeBadge />
                        <h2 className="font-heading font-black uppercase text-xl mb-4">100% MONEY-BACK GUARANTEE</h2>
                        <p className="text-[0.85rem] text-gray-400 leading-[1.75] mb-3">
                            If you attend all 3 days and genuinely feel this wasn't worth your time, just send us an email within 24 hours of the final session and we'll refund every cent. No questions asked.
                        </p>
                        <p className="text-[0.7rem] text-gray-600 italic">We're that confident in what we've built.</p>
                    </div>
                    <div className="mt-10 text-center"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
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
                        THE DECISION IS <span className="text-lime">YOURS</span>
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
                        BOOK YOUR SEAT · $19
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
        </div>
    )
}
