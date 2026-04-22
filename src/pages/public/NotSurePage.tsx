import { motion } from 'framer-motion'
import { ArrowRight, Quote, CheckCircle2, ChevronDown, ChevronUp, Eye, Calendar } from 'lucide-react'
import { useState } from 'react'
import { PublicNav } from '../../components/public/PublicNav'
import logoSrc from '../../assets/logo.png'

const GALLERY_ITEMS = [
    { label: 'Night Entrance',  img: '/lander/24.png', cls: 'col-span-2 row-span-2' },
    { label: 'Arch Detail',     img: '/lander/26.png', cls: '' },
    { label: 'Reflecting Pool', img: '/lander/27.png', cls: '' },
    { label: 'Interior Hall',   img: '/lander/30.png', cls: 'row-span-2' },
    { label: 'Section Cut',     img: '/lander/13.png', cls: '' },
    { label: 'Wide Entrance',   img: '/lander/4.png',  cls: 'col-span-2' },
    { label: 'Concept Sketch',  img: '/lander/33.png', cls: '' },
    { label: 'Materials',       img: '/lander/32.png', cls: '' },
    { label: 'Construction',    img: '/lander/9.png',  cls: '' },
    { label: 'Arena',           img: '/lander/1.png',  cls: '' },
    { label: 'Armor Detail',    img: '/lander/31.png', cls: '' },
]

const OUTCOMES = [
    { metric: '3 Days', label: 'Average time to first client ready render', sub: 'vs 3 to 4 weeks traditional workflow' },
    { metric: '8×', label: 'Faster concept iteration', sub: 'From sketch to photorealistic in minutes, not weeks' },
    { metric: '100%', label: 'Of participants used AI on a live project within 30 days', sub: 'Real deliverables, real clients' },
    { metric: '0', label: 'Prior AI experience required', sub: 'We designed this for architects, not engineers' },
]

const TESTIMONIALS = [
    {
        name: 'Sara Al-Rashid',
        role: 'Senior Architect, Dubai',
        initials: 'SA',
        quote: 'I was skeptical. I\'ve been doing this for 12 years and thought AI was a gimmick. By day two of the Sprint, I had generated a full exterior render of a villa project I was stuck on for weeks. I showed the client on day three. We closed.',
        highlight: 'Closed a client project on Day 3 of the Sprint.',
    },
    {
        name: 'Mariam Khalil',
        role: 'Interior Design Studio Owner, Abu Dhabi',
        initials: 'MK',
        quote: 'The ROI was immediate. I used to outsource renders for AED 800 to 1,200 each. Now I generate them myself in 20 minutes. The Sprint paid for itself in the first two weeks after I got back.',
        highlight: 'Recovered cost in under 2 weeks.',
    },
    {
        name: 'Faisal Al-Mutairi',
        role: 'Urban Planner, Saudi Arabia',
        initials: 'FM',
        quote: 'What surprised me most wasn\'t the output quality. It was how it changed how I think about design. AI doesn\'t replace your eye. It amplifies it. I pitch differently now.',
        highlight: 'Changed how he presents and pitches entirely.',
    },
]

const FAQS = [
    {
        q: 'I\'m not technical. Will I keep up?',
        a: 'Every person in every cohort has said some version of this on day one. By day two, they\'re generating renders. We designed the Sprint specifically for architects and designers. Zero coding, zero machine learning. If you can describe a space, you can direct AI.',
    },
    {
        q: 'I\'ve tried AI tools before and they weren\'t accurate enough.',
        a: 'You were probably using generic tools. What we teach are workflows built specifically for architectural output. Correct proportions, material logic, spatial coherence. The gap between "AI art" and "AI directed design" is enormous. This is the latter.',
    },
    {
        q: 'What if I fall behind during the Sprint?',
        a: 'The Sprint is intensive by design, but we keep cohorts small enough that no one gets left behind. Every session is recorded. You get async access to all materials. If something doesn\'t click live, it\'ll click in the replay.',
    },
    {
        q: 'I\'m worried my clients won\'t trust AI-generated work.',
        a: 'Your clients care about quality and speed. Not how it was made. The renders in our gallery? Clients approved them without knowing AI was involved. What matters is the output. And the output is indistinguishable from traditional renders — often better.',
    },
    {
        q: 'Can I apply this to my actual projects, or is it all theory?',
        a: 'Zero theory. By the end of day one you\'re running AI workflows on real briefs. By day three you leave with deliverables you can use immediately. We specifically built this to be output-first, not education-first.',
    },
]

export function NotSurePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    return (
        <div className="min-h-screen bg-black text-white font-body">
            <PublicNav />

            {/* Hero */}
            <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-28 sm:pt-36 pb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">You're not sure yet</p>
                    <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.2rem)] leading-[0.93] text-white mb-4">
                        That's fair.<br /><span className="text-lime">Let the results speak.</span>
                    </h1>
                    <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                        Every person who enrolled had the same doubts you do right now.
                        Here's what happened after they went anyway.
                    </p>
                </motion.div>
            </div>

            {/* Outcomes strip */}
            <div className="border-y border-white/[0.06] bg-white/[0.01]">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-white/[0.06]">
                    {OUTCOMES.map((o, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="sm:px-6 text-center sm:text-left"
                        >
                            <div className="font-heading font-black text-3xl text-lime mb-1">{o.metric}</div>
                            <div className="text-sm font-semibold text-white leading-snug mb-1">{o.label}</div>
                            <div className="text-xs text-gray-500">{o.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Gallery — These renders don't exist */}
            <div className="py-20 md:py-28 border-b border-white/[0.04] bg-black">
                <div className="max-w-5xl mx-auto px-5 sm:px-6">
                    <div className="mb-10 md:mb-14">
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-3">What Participants Built</p>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.8rem)] leading-[0.95] text-white">
                            These Renders Don't Exist in Real Life.<br />
                            <span className="text-lime">AI Built Them From a Sketch.</span>
                        </h2>
                        <p className="text-gray-600 text-sm max-w-lg mt-3">
                            All outputs AI-generated. No renders were outsourced. No 3D modeling software used.
                        </p>
                    </div>

                    {/* Desktop editorial grid */}
                    <div className="hidden sm:grid grid-cols-4 auto-rows-[200px] gap-3 md:gap-4">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.015 }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
                                className={`relative rounded-2xl border border-white/[0.05] hover:border-lime/25 overflow-hidden group cursor-default transition-colors duration-300 ${item.cls}`}
                            >
                                <img src={item.img} alt={item.label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                                    <Eye className="w-5 h-5 text-white" />
                                    <span className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-200">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile: 2-col */}
                    <div className="sm:hidden grid grid-cols-2 gap-3">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="relative h-36 rounded-xl border border-white/[0.05] overflow-hidden"
                            >
                                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
                                    <span className="text-[0.55rem] uppercase tracking-wider text-white/60">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white/[0.01] border-b border-white/[0.06] py-16">
                <div className="max-w-5xl mx-auto px-5 sm:px-6">
                    <div className="text-center mb-10">
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-3">From Past Participants</p>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.95] text-white">In Their Own Words</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col"
                            >
                                <Quote className="h-5 w-5 text-lime/40 mb-3 shrink-0" />
                                <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-4">"{t.quote}"</p>
                                <div className="pt-4 border-t border-white/[0.06]">
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime bg-lime/10 border border-lime/20 rounded-md px-2 py-1 mb-3">
                                        <CheckCircle2 className="h-3 w-3" /> {t.highlight}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center text-xs font-bold text-lime">
                                            {t.initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{t.name}</p>
                                            <p className="text-xs text-gray-500">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <div className="max-w-2xl mx-auto px-5 sm:px-6 py-16">
                <div className="text-center mb-10">
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-3">Still Have Doubts?</p>
                    <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.95] text-white">We've Heard All of Them.</h2>
                </div>
                <div className="space-y-2">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition"
                            >
                                <span className="font-medium text-white text-sm leading-snug">{faq.q}</span>
                                {openFaq === i
                                    ? <ChevronUp className="h-4 w-4 text-lime shrink-0" />
                                    : <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                                }
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

            {/* ── FINAL CTA / PPA ─────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                {/* Ambient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050F02] to-black" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(208,255,113,0.07)_0%,transparent_65%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-24 md:py-32">

                    {/* Top badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center mb-8"
                    >
                        <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lime border border-lime/25 bg-lime/[0.06] px-4 py-2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            Next Cohort Filling Fast
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center mb-6"
                    >
                        <h2 className="font-heading font-black uppercase text-[clamp(1.75rem,4.8vw,4rem)] leading-[0.95] text-white">
                            You've read this far.<br />
                            <span className="text-lime">You already know.</span>
                        </h2>
                    </motion.div>

                    {/* Sub copy */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="text-center text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-12"
                    >
                        The doubt doesn't go away until you're in the room. Every person who came in unsure left with deliverables they used on a live project within 30 days.
                    </motion.p>

                    {/* Social proof row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-6 mb-12"
                    >
                        {[
                            { val: '1,000+', label: 'Participants' },
                            { val: '100%', label: 'Used AI on a live project within 30 days' },
                            { val: '3 Days', label: 'To your first client-ready render' },
                        ].map(s => (
                            <div key={s.label} className="text-center px-6 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] min-w-[140px]">
                                <div className="font-heading font-black text-2xl text-lime leading-none mb-1">{s.val}</div>
                                <div className="text-[0.65rem] uppercase tracking-wider text-gray-500">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a
                            href="/submit-form"
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 hover:shadow-[0_0_40px_rgba(208,255,113,0.35)] hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Enroll in the Sprint Workshop
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="https://calendly.com/zkandar/sprint-questions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/[0.1] text-gray-400 text-sm font-medium hover:border-white/25 hover:text-white transition-all duration-200"
                        >
                            <Calendar className="h-4 w-4" />
                            Book a Free Call First
                        </a>
                    </motion.div>

                    {/* Bottom reassurance */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.55 }}
                        className="text-center text-[0.65rem] text-gray-700 uppercase tracking-[0.18em] mt-8"
                    >
                        No experience required · Output-first · Cohort spots limited
                    </motion.p>

                </div>
            </section>

            {/* Footer bar */}
            <div className="border-t border-white/[0.04] py-6">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 flex items-center justify-between gap-4">
                    <a href="/test-landingpage" className="flex items-center gap-2.5 opacity-40 hover:opacity-70 transition-opacity">
                        <img src={logoSrc} alt="" className="h-5 object-contain grayscale" />
                        <span className="text-[0.6rem] font-heading font-black uppercase tracking-[0.2em] text-white">Zkandar LLC</span>
                    </a>
                    <p className="text-[0.6rem] text-gray-700 uppercase tracking-[0.12em]">
                        © {new Date().getFullYear()} Zkandar LLC · Dubai, United Arab Emirates
                    </p>
                </div>
            </div>
        </div>
    )
}
