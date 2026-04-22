import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, Calendar, Users, Zap, Clock, Target } from 'lucide-react'
import { PublicNav } from '../../components/public/PublicNav'
import logoSrc from '../../assets/logo.png'

// ─── Question definitions ─────────────────────────────────────────────────────

const QUESTIONS = [
    {
        id: 'context',
        text: 'Which best describes your situation?',
        sub: 'Be honest — there\'s no wrong answer. This shapes everything.',
        options: [
            { label: 'Individual designer or architect', sub: 'I work independently or as part of someone else\'s team', value: 'individual' },
            { label: 'Studio or firm owner', sub: 'I run the operation — I decide what tools and training we adopt', value: 'owner' },
            { label: 'Team lead or creative director', sub: 'I manage a team of designers and set the direction', value: 'lead' },
            { label: 'Student or recent graduate', sub: 'I\'m building my career and want to get ahead early', value: 'student' },
        ],
    },
    {
        id: 'team_size',
        text: 'How many people work on design at your firm?',
        sub: 'Count everyone who touches creative or technical work.',
        options: [
            { label: 'Just me', sub: 'Solo practice — I do everything', value: 'solo' },
            { label: '2–5 people', sub: 'A small, close-knit team', value: 'small' },
            { label: '6–20 people', sub: 'A proper studio with departments', value: 'medium' },
            { label: '20+ people', sub: 'A large firm with multiple projects running', value: 'large' },
        ],
    },
    {
        id: 'ai_current',
        text: 'Where are you with AI right now?',
        sub: 'Don\'t worry about what you think you should say.',
        options: [
            { label: 'Haven\'t started yet', sub: 'I know I should, but haven\'t found the right entry point', value: 'none' },
            { label: 'Tried a few things', sub: 'Played with some tools but nothing stuck or produced real output', value: 'tried' },
            { label: 'Use it occasionally', sub: 'I use it sometimes but not consistently on client work', value: 'occasional' },
            { label: 'It\'s part of my workflow', sub: 'I use AI regularly but want to go deeper or scale it', value: 'active' },
        ],
    },
    {
        id: 'goal',
        text: 'What\'s your #1 goal with AI in the next 90 days?',
        sub: 'Pick the one that matters most right now.',
        options: [
            { label: 'Generate client-ready renders myself', sub: 'Stop outsourcing and produce faster, with full control', value: 'renders' },
            { label: 'Win more pitches and proposals', sub: 'Use AI to produce better presentations in less time', value: 'pitches' },
            { label: 'Speed up my day-to-day workflow', sub: 'Cut time on repetitive tasks — concepts, iterations, briefs', value: 'speed' },
            { label: 'Get my whole team AI-capable', sub: 'I need an operation-wide shift, not just one person upskilling', value: 'team' },
        ],
    },
    {
        id: 'timeline',
        text: 'How urgent is this for you?',
        sub: 'This helps us match you to the right format.',
        options: [
            { label: 'Very urgent — I have a live project', sub: 'I need to move in the next few weeks', value: 'urgent' },
            { label: 'Within the next 3 months', sub: 'I have a window coming up and want to be ready', value: 'soon' },
            { label: 'Planning ahead for the year', sub: 'No immediate pressure — I\'m investing in the future', value: 'planned' },
        ],
    },
] as const

type Answers = Record<string, string>

// ─── Scoring ─────────────────────────────────────────────────────────────────

type PathResult = 'sprint' | 'masterclass'

function computePath(answers: Answers): PathResult {
    let masterScore = 0

    if (answers.context === 'owner' || answers.context === 'lead') masterScore += 2
    if (answers.team_size === 'medium' || answers.team_size === 'large') masterScore += 2
    if (answers.team_size === 'small') masterScore += 1
    if (answers.goal === 'team') masterScore += 2

    return masterScore >= 3 ? 'masterclass' : 'sprint'
}

function computeReadinessScore(answers: Answers): number {
    let score = 10
    const usage = answers.ai_current
    if (usage === 'tried') score += 20
    if (usage === 'occasional') score += 40
    if (usage === 'active') score += 60
    const timeline = answers.timeline
    if (timeline === 'urgent') score += 10
    if (timeline === 'soon') score += 5
    return Math.min(score, 70)
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
    solo: 14, small: 18, medium: 32, large: 60,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-lime rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((current) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
        </div>
    )
}

function OptionCard({
    label, sub, selected, onClick,
}: { label: string; sub: string; selected: boolean; onClick: () => void }) {
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
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-black"
                        />
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
    const path = computePath(answers)
    const score = computeReadinessScore(answers)
    const hoursLost = HOURS_LOST[answers.team_size ?? 'solo'] ?? 14
    const gaugeCircumference = 2 * Math.PI * 70
    const gaugeFill = (score / 100) * gaugeCircumference

    const isSprint = path === 'sprint'

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto px-5 sm:px-6 py-8 space-y-8"
        >
            {/* Top label */}
            <div className="text-center">
                <span className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime border border-lime/25 bg-lime/[0.06] px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                    Your Assessment Results
                </span>
            </div>

            {/* Score ring + productivity gap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Readiness ring */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col items-center justify-center">
                    <svg width="160" height="160" viewBox="0 0 180 180" className="mb-4">
                        <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <motion.circle
                            cx="90" cy="90" r="70"
                            fill="none"
                            stroke={scoreColor(score)}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={gaugeCircumference}
                            strokeDashoffset={gaugeCircumference}
                            transform="rotate(-90 90 90)"
                            animate={{ strokeDashoffset: gaugeCircumference - gaugeFill }}
                            transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
                        />
                        <text x="90" y="84" textAnchor="middle" fill="white" fontFamily="inherit" fontSize="28" fontWeight="900">
                            {score}
                        </text>
                        <text x="90" y="105" textAnchor="middle" fill="#6b7280" fontFamily="inherit" fontSize="11">
                            /100
                        </text>
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
                            Estimated hours lost to manual workflows your {answers.team_size === 'solo' ? 'practice' : 'team'} could automate with AI.
                        </p>
                    </div>
                    <div className="mt-4 space-y-2">
                        {[
                            { label: 'Concept generation', pct: 85 },
                            { label: 'Render iterations', pct: 70 },
                            { label: 'Presentation prep', pct: 60 },
                        ].map(b => (
                            <div key={b.label} className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-[0.6rem] text-gray-600 uppercase tracking-wider">{b.label}</span>
                                    <span className="text-[0.6rem] text-lime/60">{b.pct}% reducible</span>
                                </div>
                                <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-lime/50 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${b.pct}%` }}
                                        transition={{ duration: 1, delay: 0.5 + Math.random() * 0.3, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendation card */}
            <div
                className="rounded-3xl overflow-hidden border"
                style={{
                    background: isSprint
                        ? 'linear-gradient(145deg, #0d1a0d 0%, #080f08 100%)'
                        : 'linear-gradient(145deg, #0f0f1a 0%, #08080f 100%)',
                    borderColor: isSprint ? 'rgba(208,255,113,0.2)' : 'rgba(139,92,246,0.25)',
                    boxShadow: isSprint
                        ? '0 0 60px -20px rgba(208,255,113,0.15)'
                        : '0 0 60px -20px rgba(139,92,246,0.15)',
                }}
            >
                <div className="px-6 sm:px-8 py-6 sm:py-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-1"
                                style={{ color: isSprint ? '#D0FF71' : '#a78bfa' }}>
                                Recommended for You
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
                            ? 'Based on your profile, you need a fast, hands-on intensive that gets you producing real AI output immediately. The Sprint Workshop is built exactly for this — 3 days, real deliverables, zero fluff.'
                            : 'Based on your profile, you need more than individual upskilling. You need a program that transforms how your entire team operates. The AI Masterclass is built for firms — we come in, build the system, and leave your operation certified.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                        {(isSprint
                            ? [
                                { icon: Clock, label: '3 Days', sub: 'Intensive' },
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
                                <f.icon className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                    style={{ color: isSprint ? '#D0FF71' : '#a78bfa' }} />
                                <div>
                                    <p className="text-xs font-bold text-white">{f.label}</p>
                                    <p className="text-[0.6rem] text-gray-600">{f.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <a
                        href={isSprint ? '/submit-form' : '/masterclass-analytics'}
                        className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-body font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                            background: isSprint ? '#D0FF71' : 'rgba(139,92,246,0.15)',
                            color: isSprint ? '#000' : '#c4b5fd',
                            border: isSprint ? 'none' : '1px solid rgba(139,92,246,0.3)',
                            boxShadow: isSprint ? '0 0 0 transparent' : 'none',
                        }}
                        onMouseEnter={e => {
                            if (isSprint) (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 30px rgba(208,255,113,0.3)'
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
                        }}
                    >
                        {isSprint ? 'Apply for the Sprint Workshop' : 'See the Masterclass Program'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>

            {/* Escape hatch */}
            <p className="text-center text-xs text-gray-700">
                Not quite right?{' '}
                <a href="/not-sure" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">
                    Browse everything we offer
                </a>
            </p>
        </motion.div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FindYourPathPage() {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [showResults, setShowResults] = useState(false)

    const question = QUESTIONS[step]
    const selected = answers[question?.id]
    const isLast = step === QUESTIONS.length - 1

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [question.id]: value }))
    }

    const handleNext = () => {
        if (!selected) return
        if (isLast) {
            setShowResults(true)
        } else {
            setStep(s => s + 1)
        }
    }

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1)
    }

    if (showResults) {
        return (
            <div className="min-h-screen bg-black text-white font-body">
                <PublicNav />
                <div className="pt-20">
                    <ResultsScreen answers={answers} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-body flex flex-col">
            <PublicNav />

            <div className="flex-1 flex flex-col pt-16">
                {/* Progress bar */}
                <div className="px-5 sm:px-10 pt-6 pb-0 max-w-2xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-gray-600 font-bold">
                            Question {step + 1} of {QUESTIONS.length}
                        </p>
                        {step > 0 && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1 text-[0.65rem] text-gray-600 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        )}
                    </div>
                    <ProgressBar current={step + 1} total={QUESTIONS.length} />
                </div>

                {/* Question */}
                <div className="flex-1 flex flex-col justify-center px-5 sm:px-6 py-8 max-w-2xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="font-heading font-black uppercase text-[clamp(1.4rem,4vw,2.2rem)] leading-[1.0] text-white mb-2">
                                    {question.text}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">{question.sub}</p>
                            </div>

                            <div className="space-y-3">
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
                                {isLast ? 'See My Results' : 'Continue'}
                                <ArrowRight className={`w-4 h-4 transition-transform ${selected ? 'group-hover:translate-x-1' : ''}`} />
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
                        <p className="text-[0.55rem] text-gray-700 uppercase tracking-wider">Takes about 1 minute</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
