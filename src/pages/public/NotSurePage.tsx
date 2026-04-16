import { motion } from 'framer-motion'
import { ArrowRight, Quote, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import logoSrc from '../../assets/logo.png'

const OUTCOMES = [
    { metric: '3 days', label: 'Average time to first client-ready render', sub: 'vs 3–4 weeks traditional workflow' },
    { metric: '8×', label: 'Faster concept iteration', sub: 'From sketch to photorealistic in minutes, not weeks' },
    { metric: '100%', label: 'Of graduates used AI on a live project within 30 days', sub: 'Real deliverables, real clients' },
    { metric: '0', label: 'Prior AI experience required', sub: 'We designed this for architects, not engineers' },
]

const TESTIMONIALS = [
    {
        name: 'Sara Al-Rashid',
        role: 'Senior Architect, Dubai',
        initials: 'SA',
        quote: 'I was skeptical. I\'ve been doing this for 12 years and thought AI was a gimmick. By day two of the Sprint, I had generated a full exterior render of a villa project I was stuck on for weeks. I showed the client on day three. We closed.',
        highlight: 'Closed a client project on day 3 of the Sprint.',
    },
    {
        name: 'Mariam Khalil',
        role: 'Interior Design Studio Owner, Abu Dhabi',
        initials: 'MK',
        quote: 'The ROI was immediate. I used to outsource renders for AED 800–1,200 each. Now I generate them myself in 20 minutes. The Sprint paid for itself in the first two weeks after I got back.',
        highlight: 'Recovered cost in under 2 weeks.',
    },
    {
        name: 'Faisal Al-Mutairi',
        role: 'Urban Planner, Saudi Arabia',
        initials: 'FM',
        quote: 'What surprised me most wasn\'t the output quality — it was how it changed how I think about design. AI doesn\'t replace your eye. It amplifies it. I pitch differently now.',
        highlight: 'Changed how he presents and pitches entirely.',
    },
]

const FAQS = [
    {
        q: 'I\'m not technical. Will I keep up?',
        a: 'Every person in every cohort has said some version of this on day one. By day two, they\'re generating renders. We designed the Sprint specifically for architects and designers — zero coding, zero machine learning. If you can describe a space, you can direct AI.',
    },
    {
        q: 'I\'ve tried AI tools before and they weren\'t accurate enough.',
        a: 'You were probably using generic tools. What we teach are workflows built specifically for architectural output — correct proportions, material logic, spatial coherence. The gap between "AI art" and "AI-directed design" is enormous. This is the latter.',
    },
    {
        q: 'Is 8,500 AED worth it for a 3-day program?',
        a: 'A single outsourced high-quality render costs 800–1,500 AED. After the Sprint, you generate those in 20 minutes. Most participants recover the cost within the first client project. The question isn\'t whether it\'s worth it — it\'s how fast it pays back.',
    },
    {
        q: 'What if I fall behind during the Sprint?',
        a: 'The Sprint is intensive by design, but we keep cohorts small enough that no one gets left behind. Every session is recorded. You get async access to all materials. If something doesn\'t click live, it\'ll click in the replay.',
    },
    {
        q: 'I\'m worried my clients won\'t trust AI-generated work.',
        a: 'Your clients care about quality and speed — not how it was made. The renders in our gallery? Clients approved them without knowing AI was involved. What matters is the output. And the output is indistinguishable from traditional renders, often better.',
    },
    {
        q: 'Can I apply this to my actual projects, or is it all theory?',
        a: 'Zero theory. By the end of day one you\'re running AI workflows on real briefs. By day three you leave with deliverables you can use immediately. We specifically built this to be output-first, not education-first.',
    },
]

export function NotSurePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                </a>
                <a
                    href="/enroll"
                    className="text-xs font-medium text-lime hover:text-lime/80 transition flex items-center gap-1"
                >
                    I'm ready to enroll <ArrowRight className="h-3.5 w-3.5" />
                </a>
            </div>

            {/* Hero */}
            <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-xs font-bold tracking-widest text-lime/70 uppercase mb-4">You're not sure yet</p>
                    <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-white mb-4">
                        That's fair.<br />Let the results speak.
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
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
                            <div className="text-3xl font-black text-lime mb-1">{o.metric}</div>
                            <div className="text-sm font-semibold text-white leading-snug mb-1">{o.label}</div>
                            <div className="text-xs text-gray-500">{o.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Gallery teaser */}
            <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16">
                <div className="text-center mb-8">
                    <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">What graduates built</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        These renders don't exist in real life.<br />
                        <span className="text-lime">AI built them from a sketch.</span>
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['/lander/24.png', '/lander/15.png', '/lander/11.png', '/lander/4.png', '/lander/9.png', '/lander/1.png'].map((src, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                            className={`relative overflow-hidden rounded-xl bg-white/5 ${i === 0 ? 'col-span-2 sm:col-span-1 h-48 sm:h-64' : 'h-36 sm:h-48'}`}
                        >
                            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                        </motion.div>
                    ))}
                </div>
                <p className="text-center text-xs text-gray-600 mt-4">
                    All outputs AI-generated. No renders were outsourced. No 3D modeling software used.
                </p>
            </div>

            {/* Testimonials */}
            <div className="bg-white/[0.01] border-y border-white/[0.06] py-16">
                <div className="max-w-5xl mx-auto px-5 sm:px-6">
                    <div className="text-center mb-10">
                        <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">From past participants</p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">In their own words</h2>
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
                    <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Still have doubts?</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">We've heard all of them.</h2>
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

            {/* Final CTA */}
            <div className="border-t border-white/[0.06] bg-white/[0.01]">
                <div className="max-w-xl mx-auto px-5 sm:px-6 py-16 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                        Ready now?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Cohort spots are limited. If you've read this far, you already know the answer.
                    </p>
                    <a
                        href="/enroll"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-lime text-black font-bold text-base hover:opacity-90 transition"
                    >
                        Enroll in the Sprint Workshop <ArrowRight className="h-5 w-5" />
                    </a>
                    <p className="text-xs text-gray-600 mt-4">8,500 AED · 3-day intensive · Next cohort filling fast</p>
                </div>
            </div>
        </div>
    )
}
