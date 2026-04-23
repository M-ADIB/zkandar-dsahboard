import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, Calendar, Users, Zap, Clock, Target, X } from 'lucide-react'
import { InlineWidget } from 'react-calendly'
import { PublicNav } from '../../components/public/PublicNav'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

// ─── Questions — 4 sections, 10 total ────────────────────────────────────────

interface QuestionOption { label: string; sub: string; value: string }
interface Question { id: string; text: string; sub: string; options: QuestionOption[] }
interface Section { id: string; label: string; intro: string; questions: Question[] }

const SECTIONS: Section[] = [
    {
        id: 'your-practice',
        label: 'Your Practice',
        intro: 'Understanding your context helps us map where AI can move the needle most for you.',
        questions: [
            {
                id: 'context',
                text: 'Which best describes your situation?',
                sub: 'Your role and setup define which skills and systems will give you the highest return.',
                options: [
                    { label: 'Individual designer or architect', sub: 'I work independently or as part of someone else\'s team', value: 'individual' },
                    { label: 'Studio or firm owner', sub: 'I run the operation — I set direction, tools, and culture', value: 'owner' },
                    { label: 'Team lead or creative director', sub: 'I manage designers and drive how the team delivers', value: 'lead' },
                    { label: 'Student or recent graduate', sub: 'Building my career and want to get ahead early', value: 'student' },
                ],
            },
            {
                id: 'team_size',
                text: 'How many people work on design at your firm?',
                sub: 'Team size changes the scope of what\'s possible — and what\'s necessary.',
                options: [
                    { label: 'Just me', sub: 'Solo practice — I own every step of every project', value: 'solo' },
                    { label: '2–5 people', sub: 'Small, close-knit team — everyone wears multiple hats', value: 'small' },
                    { label: '6–20 people', sub: 'A structured studio with departments or specialisms', value: 'medium' },
                    { label: '20+ people', sub: 'A large firm running multiple projects simultaneously', value: 'large' },
                ],
            },
        ],
    },
    {
        id: 'your-work',
        label: 'Your Work',
        intro: 'The type of work you do determines exactly which AI workflows give you the fastest lift.',
        questions: [
            {
                id: 'project_type',
                text: 'What kind of projects do you typically work on?',
                sub: 'This tells us which visualization and ideation workflows matter most to you.',
                options: [
                    { label: 'Residential — villas, apartments, homes', sub: 'High-end or mid-market residential design and visualization', value: 'residential' },
                    { label: 'Commercial and hospitality', sub: 'Hotels, F&B, retail, corporate offices', value: 'commercial' },
                    { label: 'Master planning or urban design', sub: 'Large-scale site analysis, masterplans, landscape', value: 'urban' },
                    { label: 'Mixed or client-driven', sub: 'We take what comes — the work varies project to project', value: 'mixed' },
                ],
            },
            {
                id: 'output_bottleneck',
                text: 'Where does most of your time get lost?',
                sub: 'The biggest time sinks are usually the biggest AI opportunities.',
                options: [
                    { label: 'Concept development and early ideation', sub: 'Getting the initial direction right takes too long', value: 'concepts' },
                    { label: 'Visualization and rendering', sub: 'Creating client-presentable visuals is slow or expensive', value: 'rendering' },
                    { label: 'Presentations and client materials', sub: 'Packaging the work for pitches and approvals takes too much time', value: 'presentations' },
                    { label: 'Revisions and feedback loops', sub: 'Changes take longer than the original work', value: 'revisions' },
                ],
            },
        ],
    },
    {
        id: 'your-ai-journey',
        label: 'Your AI Journey',
        intro: 'Where you are right now shapes how fast you can move — and what gaps are costing you the most.',
        questions: [
            {
                id: 'ai_current',
                text: 'Where are you with AI in your workflow today?',
                sub: 'There\'s no ideal starting point — this tells us how much ground to cover.',
                options: [
                    { label: 'Haven\'t started yet', sub: 'I know it\'s important but haven\'t found the right entry point', value: 'none' },
                    { label: 'Tried a few tools — nothing stuck', sub: 'Experimented but didn\'t get output that matched real project needs', value: 'tried' },
                    { label: 'Use it occasionally', sub: 'Comes and goes — not yet a consistent part of how I work', value: 'occasional' },
                    { label: 'It\'s part of my regular workflow', sub: 'I use AI often but want to go deeper or expand it across the team', value: 'active' },
                ],
            },
            {
                id: 'ai_tools',
                text: 'Which of these have you worked with before?',
                sub: 'Your tool history tells us where the gaps in your skill set actually are.',
                options: [
                    { label: 'None — completely new to AI tools', sub: 'Starting from scratch', value: 'none' },
                    { label: 'Midjourney or image generation tools', sub: 'Generated imagery but not in a structured design workflow', value: 'midjourney' },
                    { label: 'AI rendering or visualization tools', sub: 'Tools like Stable Diffusion, Krea, or similar', value: 'render_tools' },
                    { label: 'Multiple tools — building a workflow', sub: 'Using several together, looking to systemize them', value: 'multi' },
                ],
            },
            {
                id: 'ai_barrier',
                text: 'What\'s held you back most from going further with AI?',
                sub: 'The gap between curiosity and consistent use always has a specific cause.',
                options: [
                    { label: 'I don\'t know where to start or what to learn', sub: 'The landscape is overwhelming — too many tools, no clear path', value: 'direction' },
                    { label: 'The output quality doesn\'t match professional standards', sub: 'Results look "AI-ish" — not something I\'d show a client', value: 'quality' },
                    { label: 'I can\'t get my team to adopt it consistently', sub: 'Individuals try things but there\'s no shared workflow', value: 'team_adoption' },
                    { label: 'Time — I\'m too deep in client work to learn something new', sub: 'I need a result fast, not a long learning curve', value: 'time' },
                ],
            },
        ],
    },
    {
        id: 'your-goals',
        label: 'Your Goals',
        intro: 'What you want to achieve in the next 90 days determines which path will actually move you there.',
        questions: [
            {
                id: 'goal',
                text: 'What\'s your #1 goal with AI in the next 90 days?',
                sub: 'The most honest answer here — not the most ambitious one — gives the clearest path.',
                options: [
                    { label: 'Generate client-ready renders without outsourcing', sub: 'I want full in-house control of visualization — fast and affordable', value: 'renders' },
                    { label: 'Win more pitches with stronger visual storytelling', sub: 'Better AI-powered presentations that close clients faster', value: 'pitches' },
                    { label: 'Cut my weekly workflow time significantly', sub: 'Concepts, iterations, briefs — all faster without sacrificing quality', value: 'speed' },
                    { label: 'Build an AI-capable operation across my whole team', sub: 'I need a firm-wide shift — not just one person upskilling', value: 'team' },
                ],
            },
            {
                id: 'client_impact',
                text: 'How important is AI\'s impact on your client relationships?',
                sub: 'This tells us whether you\'re optimizing for internal speed or external positioning.',
                options: [
                    { label: 'Very important — clients are my main driver', sub: 'I want to impress clients and close more work with AI output', value: 'client_primary' },
                    { label: 'Internal first, clients will follow', sub: 'I want the team efficient first — client output will improve naturally', value: 'internal_first' },
                    { label: 'Both matter equally', sub: 'I need AI to improve how we work and what we show', value: 'both' },
                    { label: 'Not sure yet — I\'m still figuring out the use case', sub: 'I need to understand AI\'s role better before committing', value: 'unsure' },
                ],
            },
            {
                id: 'timeline',
                text: 'How soon do you need to see results?',
                sub: 'Urgency shapes the format — intensive sprint vs. deep transformation.',
                options: [
                    { label: 'Right now — I have a live project or pitch coming up', sub: 'I need output I can use in the next few weeks', value: 'urgent' },
                    { label: 'Within the next 3 months', sub: 'There\'s a window coming up and I want to be ready for it', value: 'soon' },
                    { label: 'I\'m planning ahead for the year', sub: 'No immediate pressure — this is a strategic investment', value: 'planned' },
                ],
            },
        ],
    },
]

// Flatten for indexed navigation
const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions)
const TOTAL = ALL_QUESTIONS.length

type Answers = Record<string, string>
type PathResult = 'sprint' | 'masterclass'

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computePath(answers: Answers): PathResult {
    let masterScore = 0
    if (answers.context === 'owner' || answers.context === 'lead') masterScore += 2
    if (answers.team_size === 'medium' || answers.team_size === 'large') masterScore += 2
    if (answers.team_size === 'small') masterScore += 1
    if (answers.goal === 'team') masterScore += 2
    if (answers.ai_barrier === 'team_adoption') masterScore += 1
    return masterScore >= 3 ? 'masterclass' : 'sprint'
}

function computeReadinessScore(answers: Answers): number {
    let score = 10
    const usage = answers.ai_current
    if (usage === 'tried') score += 15
    if (usage === 'occasional') score += 35
    if (usage === 'active') score += 55
    const tools = answers.ai_tools
    if (tools === 'midjourney') score += 5
    if (tools === 'render_tools') score += 8
    if (tools === 'multi') score += 12
    return Math.min(score, 72)
}

function scoreLabel(score: number): string {
    if (score < 20) return 'Starting Point'
    if (score < 40) return 'Early Stage'
    if (score < 60) return 'Building Momentum'
    return 'Ready to Accelerate'
}

function scoreColor(score: number): string {
    if (score < 25) return '#f87171'
    if (score < 50) return '#fbbf24'
    return '#D0FF71'
}

const HOURS_LOST: Record<string, number> = {
    solo: 14, small: 22, medium: 38, large: 65,
}

// ─── Calendly Modal ───────────────────────────────────────────────────────────

function CalendlyModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col"
                style={{ height: 'min(850px, 90vh)' }}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain" />
                        <span className="text-sm font-bold font-heading text-white/80">Book a Discovery Call</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 min-h-0 bg-[#111111]">
                    <InlineWidget
                        url={CALENDLY_URL}
                        styles={{ height: '100%', width: '100%' }}
                        pageSettings={{ hideGdprBanner: true, backgroundColor: '111111', textColor: 'ffffff', primaryColor: 'd0ff71' }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-lime rounded-full"
                animate={{ width: `${(current / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
        </div>
    )
}

function OptionCard({ label, sub, selected, onClick }: {
    label: string; sub: string; selected: boolean; onClick: () => void
}) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 ${
                selected
                    ? 'border-lime/50 bg-lime/[0.07] shadow-[0_0_20px_rgba(208,255,113,0.08)]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                    selected ? 'border-lime bg-lime' : 'border-white/20'
                }`}>
                    {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white leading-snug">{label}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">{sub}</p>
                </div>
            </div>
        </motion.button>
    )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({ answers }: { answers: Answers }) {
    const [modalOpen, setModalOpen] = useState(false)
    const path = computePath(answers)
    const score = computeReadinessScore(answers)
    const hoursLost = HOURS_LOST[answers.team_size ?? 'solo'] ?? 14
    const gaugeCircumference = 2 * Math.PI * 70
    const gaugeFill = (score / 100) * gaugeCircumference
    const isSprint = path === 'sprint'

    const BOTTLENECK_BARS: Record<string, { label: string; pct: number }[]> = {
        concepts:      [{ label: 'Early concept generation', pct: 88 }, { label: 'Iteration speed', pct: 75 }, { label: 'Brief to visual', pct: 65 }],
        rendering:     [{ label: 'Render turnaround', pct: 90 }, { label: 'Visual iterations', pct: 78 }, { label: 'Output quality', pct: 60 }],
        presentations: [{ label: 'Presentation prep', pct: 85 }, { label: 'Pitch visuals', pct: 80 }, { label: 'Client approval time', pct: 65 }],
        revisions:     [{ label: 'Revision cycles', pct: 82 }, { label: 'Feedback turnaround', pct: 72 }, { label: 'Change communication', pct: 58 }],
    }
    const bars = BOTTLENECK_BARS[answers.output_bottleneck] ?? [
        { label: 'Concept development', pct: 85 },
        { label: 'Visualization', pct: 72 },
        { label: 'Presentation prep', pct: 60 },
    ]

    return (
        <>
            <AnimatePresence>
                {modalOpen && <CalendlyModal onClose={() => setModalOpen(false)} />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl mx-auto px-5 sm:px-6 py-8 space-y-8"
            >
                {/* Top badge */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime border border-lime/25 bg-lime/[0.06] px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                        Your AI Readiness Assessment
                    </span>
                </div>

                {/* Score ring + productivity gap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Score ring */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col items-center justify-center">
                        <svg width="160" height="160" viewBox="0 0 180 180" className="mb-4">
                            <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <motion.circle
                                cx="90" cy="90" r="70" fill="none"
                                stroke={scoreColor(score)} strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={gaugeCircumference}
                                strokeDashoffset={gaugeCircumference}
                                transform="rotate(-90 90 90)"
                                animate={{ strokeDashoffset: gaugeCircumference - gaugeFill }}
                                transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
                            />
                            <text x="90" y="84" textAnchor="middle" fill="white" fontFamily="inherit" fontSize="28" fontWeight="900">{score}</text>
                            <text x="90" y="105" textAnchor="middle" fill="#6b7280" fontFamily="inherit" fontSize="11">/100</text>
                        </svg>
                        <p className="text-[0.65rem] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: scoreColor(score) }}>
                            {scoreLabel(score)}
                        </p>
                        <p className="text-[0.6rem] text-gray-600 uppercase tracking-wider">AI Readiness Score</p>
                    </div>

                    {/* Productivity gap */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gray-500 font-bold mb-3">Productivity Gap</p>
                            <p className="font-heading font-black text-4xl text-white leading-none">
                                {hoursLost}h
                                <span className="text-base text-gray-500 font-body font-normal ml-1">/week</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                Estimated hours your {answers.team_size === 'solo' ? 'practice' : 'team'} loses to workflows AI could handle.
                            </p>
                        </div>
                        <div className="mt-4 space-y-2">
                            {bars.map((b, i) => (
                                <div key={b.label} className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-[0.6rem] text-gray-600 uppercase tracking-wider">{b.label}</span>
                                        <span className="text-[0.6rem] text-lime/60">{b.pct}% reducible</span>
                                    </div>
                                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-lime/50 rounded-full" initial={{ width: 0 }}
                                            animate={{ width: `${b.pct}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: 'easeOut' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recommendation card */}
                <div className="rounded-3xl overflow-hidden border"
                    style={{
                        background: isSprint ? 'linear-gradient(145deg,#0d1a0d,#080f08)' : 'linear-gradient(145deg,#0f0f1a,#08080f)',
                        borderColor: isSprint ? 'rgba(208,255,113,0.2)' : 'rgba(139,92,246,0.25)',
                        boxShadow: isSprint ? '0 0 60px -20px rgba(208,255,113,0.15)' : '0 0 60px -20px rgba(139,92,246,0.15)',
                    }}
                >
                    <div className="px-6 sm:px-8 py-6 sm:py-8">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-1"
                                    style={{ color: isSprint ? '#D0FF71' : '#a78bfa' }}>
                                    Your Recommended Path
                                </p>
                                <h3 className="font-heading font-black uppercase text-2xl sm:text-3xl text-white leading-tight">
                                    {isSprint ? 'Sprint Workshop' : 'AI Masterclass'}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ background: isSprint ? 'rgba(208,255,113,0.1)' : 'rgba(139,92,246,0.1)' }}>
                                {isSprint
                                    ? <Zap className="w-5 h-5" style={{ color: '#D0FF71' }} />
                                    : <Users className="w-5 h-5" style={{ color: '#a78bfa' }} />
                                }
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed mb-5">
                            {isSprint
                                ? 'Your profile points to a fast, hands-on intensive that gets you producing real AI output immediately. 3 days. Real deliverables. You leave with a workflow that works on your next client project.'
                                : 'Your profile shows this isn\'t just about one person upskilling — it\'s about transforming how your operation works. The AI Masterclass is built for firms. We come in, build the system, and leave your team certified and producing.'}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                            {(isSprint
                                ? [
                                    { icon: Clock, label: '3 Days', sub: 'Intensive sprint' },
                                    { icon: Target, label: 'Output-First', sub: 'Real deliverables' },
                                    { icon: Zap, label: 'Day 3', sub: 'Client-ready render' },
                                ]
                                : [
                                    { icon: Users, label: 'Team-Wide', sub: 'Everyone trained' },
                                    { icon: Target, label: '15 Hours', sub: 'Live + async' },
                                    { icon: Calendar, label: 'Custom', sub: 'Your schedule' },
                                ]
                            ).map(f => (
                                <div key={f.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <f.icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: isSprint ? '#D0FF71' : '#a78bfa' }} />
                                    <div>
                                        <p className="text-xs font-bold text-white">{f.label}</p>
                                        <p className="text-[0.6rem] text-gray-600">{f.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isSprint ? (
                            <a href="/submit-form"
                                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm bg-lime text-black hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Reserve Your Spot in the Sprint
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        ) : (
                            <button
                                onClick={() => setModalOpen(true)}
                                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:-translate-y-0.5"
                                style={{
                                    background: 'rgba(139,92,246,0.12)',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                }}
                            >
                                <Calendar className="w-4 h-4" />
                                Book a Discovery Call with Khaled
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-700">
                    Want to explore both?{' '}
                    <a href="/masterclass-analytics" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">
                        See the full program overview
                    </a>
                </p>
            </motion.div>
        </>
    )
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="min-h-screen bg-black text-white font-body flex flex-col">
            <PublicNav />
            <div className="flex-1 flex items-center justify-center px-5 sm:px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-xl w-full text-center space-y-8"
                >
                    {/* Badge */}
                    <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lime border border-lime/25 bg-lime/[0.06] px-4 py-2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            AI Readiness Assessment
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="space-y-4">
                        <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.2rem)] leading-[0.95] text-white">
                            See exactly where<br />
                            <span className="text-lime">you stand with AI.</span>
                        </h1>
                        <p className="text-gray-400 text-base leading-relaxed max-w-md mx-auto">
                            10 questions. 2 minutes. You'll walk away with your AI readiness score, a clear picture of where you're losing time, and the path that actually fits your situation.
                        </p>
                    </div>

                    {/* What you get */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                            { val: 'AI Score', sub: 'Personalized to you' },
                            { val: 'Gap Report', sub: 'Hours lost per week' },
                            { val: 'Clear Path', sub: 'No guessing' },
                        ].map(i => (
                            <div key={i.val} className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                                <p className="text-xs font-bold text-white mb-0.5">{i.val}</p>
                                <p className="text-[0.6rem] text-gray-600 uppercase tracking-wider">{i.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.button
                        onClick={onStart}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:shadow-[0_0_35px_rgba(208,255,113,0.3)] transition-all duration-300"
                    >
                        Start My Assessment <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <p className="text-[0.6rem] text-gray-700 uppercase tracking-[0.15em]">
                        No sign-up required · Takes about 2 minutes
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FindYourPathPage() {
    const [started, setStarted] = useState(false)
    const [globalIdx, setGlobalIdx] = useState(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [showResults, setShowResults] = useState(false)

    if (!started) return <IntroScreen onStart={() => setStarted(true)} />

    const question = ALL_QUESTIONS[globalIdx]
    const selected = question ? answers[question.id] : undefined
    const isLast = globalIdx === TOTAL - 1

    // Which section are we in?
    let cumulativeCount = 0
    const currentSection = SECTIONS.find(s => {
        if (globalIdx < cumulativeCount + s.questions.length) return true
        cumulativeCount += s.questions.length
        return false
    }) ?? SECTIONS[0]
    const questionInSection = globalIdx - (SECTIONS.slice(0, SECTIONS.indexOf(currentSection)).reduce((acc, s) => acc + s.questions.length, 0)) + 1

    const handleSelect = (value: string) => {
        if (question) setAnswers(prev => ({ ...prev, [question.id]: value }))
    }

    const handleNext = () => {
        if (!selected) return
        if (isLast) { setShowResults(true) } else { setGlobalIdx(i => i + 1) }
    }

    const handleBack = () => {
        if (globalIdx > 0) setGlobalIdx(i => i - 1)
    }

    if (showResults) {
        return (
            <div className="min-h-screen bg-black text-white font-body">
                <PublicNav />
                <div className="pt-20"><ResultsScreen answers={answers} /></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-body flex flex-col">
            <PublicNav />

            <div className="flex-1 flex flex-col pt-16">
                {/* Progress + section label */}
                <div className="px-5 sm:px-10 pt-6 pb-0 max-w-2xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-lime/70 font-bold">{currentSection.label}</p>
                            <p className="text-[0.55rem] uppercase tracking-wider text-gray-700">
                                Question {globalIdx + 1} of {TOTAL}
                            </p>
                        </div>
                        {globalIdx > 0 && (
                            <button onClick={handleBack}
                                className="flex items-center gap-1 text-[0.65rem] text-gray-600 hover:text-white transition-colors uppercase tracking-wider">
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        )}
                    </div>
                    <ProgressBar current={globalIdx + 1} total={TOTAL} />

                    {/* Section intro — show on first question of each section */}
                    {questionInSection === 1 && (
                        <motion.p
                            key={currentSection.id}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[0.65rem] text-gray-600 mt-3 leading-relaxed border-l-2 border-lime/20 pl-3"
                        >
                            {currentSection.intro}
                        </motion.p>
                    )}
                </div>

                {/* Question */}
                <div className="flex-1 flex flex-col justify-center px-5 sm:px-6 py-6 max-w-2xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={globalIdx}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-5"
                        >
                            <div>
                                <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.8vw,2rem)] leading-[1.05] text-white mb-2">
                                    {question.text}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">{question.sub}</p>
                            </div>

                            <div className="space-y-2.5">
                                {question.options.map(opt => (
                                    <OptionCard
                                        key={opt.value}
                                        label={opt.label}
                                        sub={opt.sub}
                                        selected={selected === opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                    />
                                ))}
                            </div>

                            <motion.button
                                onClick={handleNext}
                                disabled={!selected}
                                whileHover={selected ? { scale: 1.02 } : {}}
                                whileTap={selected ? { scale: 0.98 } : {}}
                                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
                                    selected
                                        ? 'bg-lime text-black hover:shadow-[0_0_30px_rgba(208,255,113,0.3)]'
                                        : 'bg-white/[0.04] text-gray-600 cursor-not-allowed border border-white/[0.06]'
                                }`}
                            >
                                {isLast ? 'See My AI Assessment' : 'Continue'}
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.04] py-4 px-5">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 opacity-30">
                            <img src={logoSrc} alt="" className="h-4 object-contain grayscale" />
                            <span className="text-[0.55rem] font-heading font-black uppercase tracking-[0.2em] text-white">Zkandar AI</span>
                        </div>
                        <p className="text-[0.55rem] text-gray-700 uppercase tracking-wider">Takes about 2 minutes</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
