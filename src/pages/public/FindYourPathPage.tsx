import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, Calendar, Users, Zap, Clock, Target, X } from 'lucide-react'
import { InlineWidget } from 'react-calendly'
import { supabase } from '@/lib/supabase'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

// ─── Questions — 4 sections, 10 total ────────────────────────────────────────

interface QuestionOption { label: string; sub: string; value: string }
interface Question { id: string; text: string; sub: string; options: QuestionOption[] }
interface Section { id: string; label: string; intro: string; questions: Question[] }

const SECTIONS: Section[] = [
    {
        id: 'your-profile',
        label: 'Your Profile',
        intro: 'Understanding your role and setup helps us map where AI can move the needle most for you.',
        questions: [
            {
                id: 'context',
                text: 'Which best describes your role?',
                sub: 'Your role defines which skills and systems will give you the highest return.',
                options: [
                    { label: 'Individual designer or architect', sub: 'I work independently or as part of someone else\'s team', value: 'individual' },
                    { label: 'Studio or firm owner', sub: 'I run the operation — I set direction, tools, and culture', value: 'owner' },
                    { label: 'Team lead or creative director', sub: 'I manage designers and drive how the team delivers', value: 'lead' },
                    { label: 'Student or recent graduate', sub: 'I\'m building my skills and portfolio', value: 'student' },
                ],
            },
            {
                id: 'team_size',
                text: 'How many people work on design at your firm?',
                sub: 'Team size shapes what kind of AI system makes sense.',
                options: [
                    { label: 'Just me', sub: 'Solo practice — I wear all the hats', value: 'solo' },
                    { label: '2–5 people', sub: 'Small team, tight collaboration', value: 'small' },
                    { label: '6–20 people', sub: 'Mid-size studio with multiple roles', value: 'medium' },
                    { label: '20+ people', sub: 'Large firm with departments', value: 'large' },
                ],
            },
        ],
    },
    {
        id: 'your-work',
        label: 'Your Work',
        intro: 'The type of work you do shapes which AI tools and workflows matter most.',
        questions: [
            {
                id: 'project_type',
                text: 'What type of work do you mainly do?',
                sub: 'This helps us match you to the most relevant AI tools and workflows.',
                options: [
                    { label: 'Architectural concepts & design development', sub: 'Schematic design, spatial concepts, planning', value: 'concepts' },
                    { label: 'Rendering & visualization', sub: 'Client-facing renders, mood boards, CGI', value: 'rendering' },
                    { label: 'Client presentations & pitches', sub: 'Decks, proposals, storytelling materials', value: 'presentations' },
                    { label: 'Revisions & production drawings', sub: 'Technical work, iterations, documentation', value: 'revisions' },
                ],
            },
        ],
    },
    {
        id: 'your-readiness',
        label: 'Your AI Readiness',
        intro: 'We need to understand where you are right now — not where you want to be.',
        questions: [
            {
                id: 'ai_frequency',
                text: 'How often do you currently use AI in your design work?',
                sub: 'Be honest — this is the baseline we\'ll build from.',
                options: [
                    { label: 'Never used it', sub: 'I haven\'t tried AI tools for design work yet', value: 'never' },
                    { label: 'Tried it a few times', sub: 'I\'ve experimented but don\'t use it regularly', value: 'few_times' },
                    { label: 'A few times a week', sub: 'It\'s becoming part of my process', value: 'weekly' },
                    { label: 'Part of my daily workflow', sub: 'I use AI tools almost every working day', value: 'daily' },
                ],
            },
            {
                id: 'ai_tools',
                text: 'Which AI tools have you used for design?',
                sub: 'Select the option that best describes your current toolkit.',
                options: [
                    { label: 'None yet', sub: 'I haven\'t used AI tools for design work', value: 'none' },
                    { label: 'Midjourney or similar image generators', sub: 'Text-to-image tools for concepts or mood boards', value: 'midjourney' },
                    { label: 'AI rendering or visualization tools', sub: 'Tools like Veras, Archvision, or similar', value: 'render_tools' },
                    { label: 'Multiple AI tools across different stages', sub: 'I use AI at several points in my process', value: 'multi' },
                ],
            },
            {
                id: 'ai_output_quality',
                text: 'What\'s the best quality output you\'ve produced with AI so far?',
                sub: 'Think of the best single piece of work you\'ve made using AI.',
                options: [
                    { label: 'Haven\'t produced anything yet', sub: 'Still exploring or haven\'t started', value: 'nothing' },
                    { label: 'Rough concepts only', sub: 'Not something I\'d show a client', value: 'rough' },
                    { label: 'Decent visuals but need significant cleanup', sub: 'Good enough for internal use, not client-ready', value: 'decent' },
                    { label: 'Client-ready renders I\'ve actually used', sub: 'Output I\'ve presented to real clients', value: 'client_ready' },
                ],
            },
            {
                id: 'ai_client_use',
                text: 'Have you delivered AI-generated visuals to a real client?',
                sub: 'This tells us whether your AI work has crossed the professional threshold.',
                options: [
                    { label: 'No, not yet', sub: 'I haven\'t used AI output in a client context', value: 'never' },
                    { label: 'Once or twice, as a test', sub: 'I tried it but haven\'t made it a habit', value: 'once' },
                    { label: 'Yes, a handful of times', sub: 'I\'ve delivered AI work to clients occasionally', value: 'occasionally' },
                    { label: 'Yes, it\'s a normal part of my client work', sub: 'AI-generated output is standard in my deliverables', value: 'regularly' },
                ],
            },
            {
                id: 'ai_confidence',
                text: 'How confident are you at prompting AI to get the result you want?',
                sub: 'Prompting is a skill — where are you on that curve?',
                options: [
                    { label: 'Not confident at all — I\'m mostly guessing', sub: 'Results feel random and hard to control', value: 'not_at_all' },
                    { label: 'A little — sometimes it works, often it doesn\'t', sub: 'I get decent results occasionally but can\'t repeat it', value: 'a_little' },
                    { label: 'Fairly confident — I can usually get close', sub: 'I have some techniques that work most of the time', value: 'fairly' },
                    { label: 'Very confident — I have a system that works consistently', sub: 'I can reliably produce professional output through prompting', value: 'very' },
                ],
            },
        ],
    },
    {
        id: 'your-goals',
        label: 'Your Goals',
        intro: 'The last two questions help us understand what you\'re actually trying to solve.',
        questions: [
            {
                id: 'ai_gap',
                text: 'What\'s the biggest gap in your AI workflow right now?',
                sub: 'Pick the one that frustrates you most.',
                options: [
                    { label: 'I don\'t know where to start or what to focus on', sub: 'Too many tools and options, no clear direction', value: 'direction' },
                    { label: 'Output quality isn\'t good enough for professional use', sub: 'I can generate things but they don\'t look right', value: 'quality' },
                    { label: 'I can do it once but can\'t repeat it reliably', sub: 'Results are inconsistent — I can\'t build a repeatable process', value: 'consistency' },
                    { label: 'I use it but my team doesn\'t — adoption is the problem', sub: 'The bottleneck is getting others on board', value: 'team' },
                ],
            },
            {
                id: 'timeline',
                text: 'How soon do you want to be producing AI work consistently?',
                sub: 'Your timeline shapes which path makes the most sense.',
                options: [
                    { label: 'Right now — I have a live project or pitch coming up', sub: 'I need results fast', value: 'urgent' },
                    { label: 'Within the next 3 months', sub: 'I\'m committed, just not in a rush', value: 'soon' },
                    { label: 'Longer term — building toward it steadily', sub: 'No hard deadline, but it\'s a real priority', value: 'planned' },
                    { label: 'I\'m still deciding if it\'s worth the investment', sub: 'Need to see more before committing', value: 'unsure' },
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
    if (answers.ai_gap === 'team') masterScore += 1
    return masterScore >= 3 ? 'masterclass' : 'sprint'
}

function computeReadinessScore(answers: Answers): number {
    let score = 4

    const freq: Record<string, number> = { never: 0, few_times: 5, weekly: 12, daily: 16 }
    score += freq[answers.ai_frequency] ?? 0

    const tools: Record<string, number> = { none: 0, midjourney: 3, render_tools: 5, multi: 7 }
    score += tools[answers.ai_tools] ?? 0

    const quality: Record<string, number> = { nothing: 0, rough: 3, decent: 5, client_ready: 8 }
    score += quality[answers.ai_output_quality] ?? 0

    const clientUse: Record<string, number> = { never: 0, once: 2, occasionally: 4, regularly: 6 }
    score += clientUse[answers.ai_client_use] ?? 0

    const conf: Record<string, number> = { not_at_all: 0, a_little: 2, fairly: 4, very: 8 }
    score += conf[answers.ai_confidence] ?? 0

    return Math.min(score, 49)
}

function scoreLabel(score: number): string {
    if (score < 13) return 'Just Starting'
    if (score < 26) return 'Dabbling'
    if (score < 39) return 'Gaining Ground'
    return 'AI-Active'
}

function scoreColor(score: number): string {
    if (score < 13) return '#f87171'
    if (score < 26) return '#fbbf24'
    if (score < 39) return '#60a5fa'
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
    const bars = BOTTLENECK_BARS[answers.project_type] ?? [
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
                            <a href="https://buy.stripe.com/00wbJ10jzeCB3jGdfd1wY0M"
                                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm bg-lime text-black hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Direct Checkout — Sprint Workshop
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

// ─── Lead capture gate ────────────────────────────────────────────────────────

function GateScreen({ onSubmit }: { onSubmit: (name: string, email: string) => Promise<void> }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedName = name.trim()
        const trimmedEmail = email.trim()
        if (!trimmedName) { setError('Please enter your name.'); return }
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError('Please enter a valid email address.')
            return
        }
        setError('')
        setSubmitting(true)
        await onSubmit(trimmedName, trimmedEmail)
        setSubmitting(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg mx-auto px-5 sm:px-6 py-8"
        >
            <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime border border-lime/25 bg-lime/[0.06] px-3 py-1.5 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                    Assessment Complete
                </span>
                <h2 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,2.2rem)] text-white leading-tight mt-4 mb-3">
                    Your AI Readiness Score is Ready.
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Enter your name and email to see your results and recommended path.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-lime/40 focus:bg-white/[0.06] transition-all"
                />
                <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-lime/40 focus:bg-white/[0.06] transition-all"
                />
                {error && (
                    <p className="text-xs text-red-400 pl-1">{error}</p>
                )}
                <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm bg-lime text-black hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                    {submitting ? 'Loading...' : 'See My Results'}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                </motion.button>
            </form>

            <p className="text-center text-[0.6rem] text-gray-700 mt-4">
                No spam. We use this to send you your results and relevant updates only.
            </p>
        </motion.div>
    )
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="min-h-screen bg-black text-white font-body flex flex-col">
            <PublicNav />
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-xl"
                >
                    <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime border border-lime/25 bg-lime/[0.06] px-3 py-1.5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                        AI Readiness Assessment
                    </span>

                    <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.2rem)] leading-[1.02] text-white mb-4">
                        Find Out Where You
                        <br />
                        <span className="text-lime">Actually Stand</span> With AI.
                    </h1>

                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-8 max-w-sm mx-auto">
                        10 questions. Honest score. A clear path forward — whether that's a Sprint Workshop or the AI Masterclass.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-[0.6rem] text-gray-600 uppercase tracking-wider mb-10">
                        <span>10 questions</span>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />
                        <span>~3 minutes</span>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />
                        <span>No fluff</span>
                    </div>

                    <motion.button
                        onClick={onStart}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:shadow-[0_0_40px_rgba(208,255,113,0.3)] transition-all duration-300"
                    >
                        Start Assessment
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
            <PublicFooter />
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FindYourPathPage() {
    const [started, setStarted] = useState(false)
    const [globalIdx, setGlobalIdx] = useState(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [showGate, setShowGate] = useState(false)
    const [showResults, setShowResults] = useState(false)

    if (!started) return <IntroScreen onStart={() => setStarted(true)} />

    const question = ALL_QUESTIONS[globalIdx]
    const selected = question ? answers[question.id] : undefined
    const isLast = globalIdx === TOTAL - 1

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
        if (isLast) { setShowGate(true) } else { setGlobalIdx(i => i + 1) }
    }

    const handleBack = () => {
        if (globalIdx > 0) setGlobalIdx(i => i - 1)
    }

    const handleGateSubmit = async (name: string, email: string) => {
        const path = computePath(answers)
        const score = computeReadinessScore(answers)
        try {
            await (supabase.from('assessment_submissions') as any).insert({
                name,
                email,
                answers,
                readiness_score: score,
                path_result: path,
                context: answers.context ?? null,
                team_size: answers.team_size ?? null,
            })
        } catch (err) {
            console.error('Assessment submission failed:', err)
        }
        setShowResults(true)
    }

    if (showGate && !showResults) {
        return (
            <div className="min-h-screen bg-black text-white font-body">
                <PublicNav />
                <div className="pt-20">
                    <GateScreen onSubmit={handleGateSubmit} />
                </div>
                <PublicFooter />
            </div>
        )
    }

    if (showResults) {
        return (
            <div className="min-h-screen bg-black text-white font-body">
                <PublicNav />
                <div className="pt-20"><ResultsScreen answers={answers} /></div>
                <PublicFooter />
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

                <PublicFooter />
            </div>
        </div>
    )
}
