import { useState, useEffect } from 'react'

import { Check, Play } from 'lucide-react'
// Nav/Footer intentionally removed — standalone landing page
import { trackFBEvent } from '@/lib/fbpixel'
import logoSrc from '@/assets/logo.png'
import {
    FadeIn, Section, SectionHeading, SeatsCounter, CountdownTimer,
    CtaButton, ScarcityPricing, TestimonialCard, FaqItem,
    BeforeAfterSection, ValueTable, GuaranteeBadge, LeadCaptureModal,
} from '@/components/webinar/WebinarComponents'

/* ── Constants ─────────────────────────────────────────── */
const TARGET_DATE = new Date('2026-06-07T19:00:00+04:00')
const VSL_ID = '' // Set Vimeo ID when ready

const FAQS = [
    { q: 'Do I need any AI experience to join?', a: 'No. This webinar is designed for all levels — whether you\'ve never touched an AI tool or you\'ve been experimenting on your own.' },
    { q: 'What if I can\'t attend one of the 3 days?', a: 'All sessions will be recorded and shared with registered participants within 24 hours.' },
    { q: 'Is this only for interior designers?', a: 'Primarily yes, but architects, product designers, and anyone in the built environment will benefit greatly.' },
    { q: 'What tools will be covered?', a: 'We\'ll cover AI tools relevant to the design workflow — including Midjourney, ChatGPT, and project management frameworks. No paid subscriptions required during the event.' },
    { q: 'Will I get a certificate?', a: 'Yes. Participants who attend all 3 sessions and complete the post-event assignment will receive a Zkandar AI certificate.' },
    { q: 'What\'s the schedule and time zone?', a: 'The webinar runs over 3 consecutive days at 6:00 PM GST (Dubai time). Each day is approximately 2 hours.' },
    { q: 'Why is it so affordable?', a: 'We want this knowledge to reach as many designers as possible. The early-bird price is our way of rewarding fast action — it won\'t last.' },
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
        items: ['Project review and final adjustments — practical session', 'Using AI to develop and refine projects'],
    },
]

/* ── Page Component ────────────────────────────────────── */
export default function WebinarPage() {
    const [seats] = useState(47)
    const [leadModalOpen, setLeadModalOpen] = useState(false)
    const [activeFaq, setActiveFaq] = useState<number | null>(null)
    const [vslPlaying, setVslPlaying] = useState(false)

    useEffect(() => { trackFBEvent('ViewContent', { content_name: 'webinar_page' }) }, [])

    const openCta = () => {
        trackFBEvent('Lead', { content_name: 'webinar_cta_click' })
        setLeadModalOpen(true)
    }

    const handleLeadSuccess = (data: { name: string; email: string; phone: string }) => {
        setLeadModalOpen(false)
        trackFBEvent('Lead', { content_name: 'webinar_lead_captured', email: data.email })
        // TODO: Redirect to checkout page with upsells
        // For now, open a thank-you or checkout URL
        window.location.href = `/webinar/checkout?name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}`
    }

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30 selection:text-black">


            {/* ═══ S1: HERO ═══ */}
            <section className="pt-16 pb-8 md:pt-20 md:pb-12">
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
                        <h1 className="font-heading font-black uppercase text-[clamp(2rem,5.5vw,4rem)] leading-[0.9] tracking-[0.01em]">
                            THE SECRET BEHIND<br />DESIGNING PROJECTS{' '}
                            <span className="text-lime">10× FASTER</span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-[0.95rem] md:text-lg text-gray-300 max-w-xl mx-auto leading-[1.75]">
                            We'll share our exact AI workflow system for interior design projects — from initial concept to client presentation — step by step.
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
                        <p className="text-[0.7rem] text-gray-600 mt-2">Suitable for all levels — from beginner to advanced</p>
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                <FadeIn><ScarcityPricing currentTier={1} targetDate={TARGET_DATE} onCta={openCta} /></FadeIn>
            </Section>

            {/* ═══ S4: TESTIMONIALS ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading>WHAT PAST PARTICIPANTS <span className="text-lime">SAY</span></SectionHeading>
                </FadeIn>
                <div className="grid md:grid-cols-3 gap-4">
                    <FadeIn><TestimonialCard quote="For the first time, everything clicked. I finally understood how AI fits into my entire workflow — not just random tools, but a complete system." name="Sara Al-Mansoori" role="Interior Designer, Dubai" /></FadeIn>
                    <FadeIn delay={0.1}><TestimonialCard quote="This completely changed how I think about design projects. I used to spend days on presentations — now I can do it in hours with better quality." name="Omar Haddad" role="Architect, Riyadh" /></FadeIn>
                    <FadeIn delay={0.2}><TestimonialCard quote="It's practical, not theory. By the end of day one I was already applying what I learned to a real client project." name="Nour El-Khatib" role="Freelance Designer, Beirut" /></FadeIn>
                </div>
            </Section>

            {/* ═══ S5: CONTENT BREAKDOWN ═══ */}
            <Section dark>
                <FadeIn>
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="grid grid-cols-2 gap-3 order-2 md:order-1">
                            {[
                                { label: 'Design Concept', img: '/casestudies/logan/flamboyant/1.jpg' },
                                { label: 'Moodboard', img: '/casestudies/logan/flamboyant/4.jpg' },
                                { label: 'AI Workflow', img: '/casestudies/logan/st-regis/1.jpg' },
                                { label: 'Presentation', img: '/casestudies/logan/almina/1.jpg' },
                            ].map((item, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                                    <img src={item.img} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <span className="absolute bottom-3 left-3 text-[0.6rem] text-white/80 uppercase tracking-[0.15em] font-bold">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-5 order-1 md:order-2">
                            <SectionHeading center={false}>
                                WHAT YOU'LL <span className="text-lime">LEARN</span>
                            </SectionHeading>
                            <p className="text-[0.85rem] text-gray-300 leading-[1.75]">Over 3 days, we'll walk you through every step of executing a real interior design project — to uncover the real secret behind the most successful designers in the AI era.</p>
                            <p className="text-[0.85rem] text-white/80 font-semibold">
                                Real project + Clear action plan = <span className="text-lime">6 hours of condensed expertise</span>
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </Section>

            {/* ═══ S6: MID-PAGE CTA ═══ */}
            <Section>
                <FadeIn className="text-center space-y-6">
                    <p className="text-[0.6rem] text-gray-600 uppercase tracking-[0.2em] font-bold">Offer ends: June 1, 2026</p>
                    <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.2rem)] leading-[0.93]">
                        REGISTER NOW AND DISCOVER THE SECRET OF{' '}
                        <span className="text-lime">THE MOST SUCCESSFUL DESIGNERS</span>
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
                                    'A freelancer looking for a system to deliver projects faster',
                                    'A design studio owner modernizing their team\'s workflow with AI',
                                    'A product or furniture designer in interior projects',
                                    'Someone new who wants to start with cutting-edge tools',
                                    'An ambitious professional who invests in themselves',
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-[0.82rem] text-gray-300 leading-relaxed">
                                        <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />{item}
                                    </li>
                                ))}
                            </ul>
                            <CtaButton onClick={openCta} label="INVEST IN YOURSELF — BOOK MY SEAT" size="md" />
                        </div>
                        <div className="hidden md:block w-full rounded-2xl border border-white/[0.08] overflow-hidden aspect-[3/4] bg-[#111]">
                            <img src="/bio-khaled-portrait.jpg" alt="Instructor" className="w-full h-full object-cover object-top" loading="lazy" />
                        </div>
                    </div>
                </FadeIn>
            </Section>

            {/* ═══ S8: BENEFITS ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="You'll see a complete interior design project executed with AI integrated at every stage — from the initial idea to the final client presentation.">
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
                                <p className="text-lime text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-1">{d.day} — {d.date}</p>
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
                        If you learn how to integrate AI into every stage of your design process, you'll discover a new level of speed and execution — up to
                    </p>
                    <p className="text-lime font-heading font-black text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none">10× Faster</p>
                    <p className="text-[0.95rem] text-gray-300 max-w-lg mx-auto leading-relaxed">than traditional methods. More projects, higher income, real control over your future.</p>
                    <p className="text-[0.8rem] text-gray-500 max-w-md mx-auto">This is exactly what we've learned over 15 years — and we built this webinar to share it with you in just 6 hours.</p>
                    <div className="pt-4"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
            </Section>

            {/* ═══ S11: INSTRUCTOR BIO ═══ */}
            <Section dark>
                <FadeIn>
                    <div className="grid md:grid-cols-[1fr_240px] gap-12 items-center">
                        <div className="space-y-5">
                            <SectionHeading center={false}>ABOUT <span className="text-lime">KHALED ISKANDAR</span></SectionHeading>
                            <p className="text-[0.85rem] text-gray-300 leading-[1.75]">Khaled is an architect and interior designer turned AI educator & workflow strategist.</p>
                            <p className="text-[0.85rem] text-gray-300 leading-[1.75]">
                                Founder of Zkandar AI with <strong className="text-white">10+ years</strong> of experience in design and business. He's trained{' '}
                                <strong className="text-white">300+ designers</strong> across the UAE through workshops at Vitra, SIKKA, The Lighting Institute, and more.
                            </p>
                            <p className="text-[0.85rem] text-gray-400 leading-[1.75]">This webinar is the distilled version of everything he's learned — designed to help you build a real, profitable design career with AI.</p>
                            <img src={logoSrc} alt="Zkandar" className="h-5 opacity-30" />
                        </div>
                        <div className="hidden md:block w-full aspect-[3/4] rounded-2xl border border-white/[0.08] overflow-hidden bg-[#111]">
                            <img src="/bio-khaled-portrait.jpg" alt="Khaled Iskandar" className="w-full h-full object-cover object-top" loading="lazy" />
                        </div>
                    </div>
                    <div className="mt-10"><CtaButton onClick={openCta} size="md" /></div>
                </FadeIn>
            </Section>

            {/* ═══ S12: VALUE STACKING ═══ */}
            <Section>
                <FadeIn>
                    <SectionHeading sub="You're not just attending sessions — you're getting a complete toolkit:">
                        WHAT YOU GET <span className="text-lime">WHEN YOU REGISTER</span>
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
                    <p className="text-[0.85rem] text-gray-400">{seats} seats. 3 days. A workflow that could change your career.</p>
                    <div className="pt-2"><CtaButton onClick={openCta} /></div>
                    <SeatsCounter seats={seats} className="mt-6" />
                </FadeIn>
            </Section>

            {/* ═══ STICKY BOTTOM BAR ═══ */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06]">
                <div className="max-w-[52rem] mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                        onClick={openCta}
                        className="w-full sm:w-auto bg-lime text-black font-heading font-black uppercase text-[0.8rem] px-8 py-3 rounded-full hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] transition-all tracking-[0.04em]"
                    >
                        BOOK YOUR SEAT — JUST $19
                    </button>
                    <div className="flex items-center gap-2 text-[0.75rem] text-gray-500">
                        <span>Offer ends:</span>
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
                onSuccess={handleLeadSuccess}
            />
        </div>
    )
}
