import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { PopupModal } from 'react-calendly'
import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.section>
    )
}

const benefits = [
    {
        title: 'Control AI output',
        body: 'Stop fighting unpredictable results. Learn to direct AI with precision so it fits your visual language every time.',
    },
    {
        title: 'A repeatable workflow',
        body: 'Walk away with a structured system built around how design studios actually work, not generic prompting tips.',
    },
    {
        title: 'Faster concept development',
        body: 'Compress days of ideation into hours. Generate, evaluate, and refine concepts at a pace that wasn\'t possible before.',
    },
    {
        title: 'Team alignment',
        body: 'Everyone on the same page about when, how, and why to use AI — reducing inconsistency across your studio.',
    },
    {
        title: 'Client-facing confidence',
        body: 'Know exactly where AI fits (and where it doesn\'t) in client work. Present results with full creative ownership.',
    },
    {
        title: 'A toolkit you keep',
        body: 'Frameworks, prompt libraries, and workflow templates you can use immediately and build on long after the program ends.',
    },
]

const testimonials = [
    {
        quote: 'This completely changed how our team approaches the early stages of a project. We\'re generating better concepts in a fraction of the time.',
        name: 'Sofia M.',
        role: 'Creative Director, Studio Forma',
    },
    {
        quote: 'I was skeptical going in. I left with a workflow I use every single day. The difference in output quality is real.',
        name: 'James R.',
        role: 'Senior Designer, Atelier Nord',
    },
    {
        quote: 'Finally a program that respects that we\'re designers first. Not a tech course, a design course that happens to use AI.',
        name: 'Lena K.',
        role: 'Head of Design, Blank Studio',
    },
]

export function ProgramPage() {
    const [calendlyOpen, setCalendlyOpen] = useState(false)
    return (
        <>
        <PopupModal
            url={CALENDLY_URL}
            open={calendlyOpen}
            onModalClose={() => setCalendlyOpen(false)}
            rootElement={document.body}
        />
        <div className="min-h-screen bg-[#0B0B0B] text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden">
            {/* Ambient gradient orbs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full pointer-events-none z-0 animate-float-slow" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#D0FF71]/8 blur-[140px] rounded-full pointer-events-none z-0 animate-float-slow-reverse" />

            {/* Noise overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Background logo */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
                <img src={logoSrc} alt="" className="w-[80%] md:w-[55%] lg:w-[40%] max-w-[600px] grayscale object-contain" />
            </div>

            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, -20px) scale(1.05); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 15px) scale(1.03); }
                }
                .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
                .animate-float-slow-reverse { animation: float-slow-reverse 25s ease-in-out infinite; }
            `}</style>

            <div className="max-w-[960px] mx-auto px-6 py-16 md:py-24 space-y-24 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 pb-4 border-b border-white/5"
                >
                    <img src={logoSrc} alt="Zkandar AI" className="h-9 object-contain" />
                    <span className="text-sm font-heading font-bold tracking-wider text-white/70">Zkandar AI</span>
                    <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-lime/60 font-bold border border-lime/20 px-3 py-1 rounded-full">Program</span>
                </motion.div>

                {/* Hero */}
                <Section>
                    <div className="space-y-8">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-lime font-body"
                        >
                            AI Masterclass
                        </motion.span>
                        <h1
                            className="font-heading font-black text-white"
                            style={{
                                lineHeight: 1.15,
                                letterSpacing: '-0.02em',
                                wordSpacing: '0.05em',
                                maxWidth: '820px',
                                overflowWrap: 'break-word',
                                hyphens: 'none',
                                whiteSpace: 'normal',
                                fontSize: 'clamp(28px, 6vw, 52px)',
                            }}
                        >
                            Zkandar AI Masterclass
                        </h1>
                        <p
                            className="text-base md:text-lg text-gray-400 leading-relaxed font-body"
                            style={{ marginTop: '20px', maxWidth: '600px' }}
                        >
                            A structured program for architecture and design studios that want to go beyond experimenting and build real AI workflows that stick.
                        </p>
                    </div>
                </Section>

                {/* Main offering card */}
                <Section>
                    <div className="bg-bg-card border-l-4 border-lime rounded-2xl p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-heading font-black text-white">What the program is</h2>
                            <p className="text-gray-400 text-sm mt-2 font-body leading-relaxed">
                                A hands-on, studio-first AI program designed to give design teams a complete operating system for using AI in their work. Not a lecture series, a working system you build and own.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-lime/60 font-bold font-heading">Format</span>
                                <p className="text-sm text-white font-body">Live workshops + async exercises</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-lime/60 font-bold font-heading">Duration</span>
                                <p className="text-sm text-white font-body">4 weeks, studio-paced</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-lime/60 font-bold font-heading">Delivery</span>
                                <p className="text-sm text-white font-body">In-person or remote</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* What you'll gain */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What you'll gain</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {benefits.map((b, i) => (
                                <motion.div
                                    key={b.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-bg-card border border-border rounded-2xl p-6 space-y-2 group hover:border-lime/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                                        <h3 className="text-sm font-bold text-white font-heading">{b.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-body pl-3.5">{b.body}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Why this makes sense */}
                <Section>
                    <div className="bg-bg-card border border-border rounded-2xl p-8 space-y-4">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">Why this makes sense right now</h2>
                        <p className="text-gray-400 leading-relaxed font-body text-sm md:text-base">
                            Our survey of +200 designers across 5 studios found that 78% are either not using AI or only experimenting, with no structured workflow in place. The gap isn't tool access. Leadership sees the opportunity but teams lack the framework to act on it. This program closes that gap with a system built specifically for design studios, not generic knowledge workers.
                        </p>
                        <p className="text-gray-400 leading-relaxed font-body text-sm md:text-base">
                            Studios that build an internal AI workflow now will have a compounding advantage over the next 2-3 years. The ones that don't will face widening delivery gaps, skill disparity in their teams, and increasing difficulty attracting talent that expects to work with modern tools.
                        </p>
                    </div>
                </Section>

                {/* Testimonials */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What participants say</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {testimonials.map((t, i) => (
                                <motion.div
                                    key={t.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
                                >
                                    <p className="text-sm text-gray-300 leading-relaxed font-body italic flex-1">"{t.quote}"</p>
                                    <div>
                                        <p className="text-sm font-bold text-white font-heading">{t.name}</p>
                                        <p className="text-xs text-gray-500 font-body">{t.role}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* CTA */}
                <Section className="text-center pb-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-heading font-black tracking-wide">
                            Ready to get started?
                        </h2>
                        <p className="text-gray-400 text-base font-body">
                            Book a free 30-minute discovery call. We'll walk through your studio's current setup and whether this program is the right fit.
                        </p>
                        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
                            <button
                                onClick={() => setCalendlyOpen(true)}
                                className="px-8 py-3.5 bg-lime text-black font-bold rounded-xl hover:bg-lime-400 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5"
                            >
                                Talk to Us
                            </button>
                            <Link
                                to="/thank-you"
                                className="px-8 py-3.5 border border-white/15 text-white font-bold rounded-xl hover:border-lime/40 hover:text-lime transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5"
                            >
                                I Have Booked
                            </Link>
                        </div>
                    </div>
                </Section>

                {/* Footer */}
                <div className="text-center pt-8 pb-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 opacity-40">
                        <img src={logoSrc} alt="" className="h-5 object-contain grayscale" />
                        <span className="text-xs font-heading tracking-wider">Zkandar AI</span>
                    </div>
                </div>

            </div>
        </div>
        </>
    )
}
