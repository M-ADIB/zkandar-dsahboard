import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Interest = 'masterclass' | 'sprint' | 'other' | null
type Commitment = 'ready' | 'curious' | 'exploring' | null

const ROLES = [
    'Architect',
    'Interior Designer',
    'Urban Planner',
    'Landscape Architect',
    'Design Studio Owner',
    'Real Estate Developer',
    'Design Student',
    'Other',
]

const INTEREST_OPTIONS = [
    {
        id: 'masterclass' as const,
        title: 'AI Masterclass',
        tag: 'FOR TEAMS',
        description: 'Transform how your entire firm works. Train your team to run AI-directed design workflows end-to-end.',
        detail: '8-week deep dive · Team of 3–12 · Live sessions + async work',
    },
    {
        id: 'sprint' as const,
        title: 'Sprint Workshop',
        tag: 'FOR INDIVIDUALS',
        description: 'Go from zero to AI-fluent in days, not months. Intensive, hands-on, output-focused.',
        detail: '3-day sprint · Solo or duo · Real deliverables by day 3',
    },
    {
        id: 'other' as const,
        title: 'Something Else',
        tag: 'TELL US',
        description: 'A custom engagement, a keynote, a licensing deal — if the idea is sharp, we want to hear it.',
        detail: 'Custom scope · We\'ll reach out to explore',
    },
]

const COMMITMENT_OPTIONS = [
    {
        id: 'ready' as const,
        label: 'Ready to build. Let\'s move.',
        sub: 'I know what I want — just show me how to start.',
        color: 'border-lime/40 bg-lime/5 hover:border-lime/60',
        activeColor: 'border-lime bg-lime/10',
        dot: 'bg-lime',
    },
    {
        id: 'curious' as const,
        label: 'Interested — I have a few questions first.',
        sub: 'I\'m in the right direction but want to make sure this fits before committing.',
        color: 'border-white/10 bg-white/[0.02] hover:border-white/20',
        activeColor: 'border-white/30 bg-white/[0.05]',
        dot: 'bg-white/50',
    },
    {
        id: 'exploring' as const,
        label: 'Still mapping the territory.',
        sub: 'I\'m early in the process. Keep me in the loop.',
        color: 'border-white/10 bg-white/[0.02] hover:border-white/20',
        activeColor: 'border-white/30 bg-white/[0.05]',
        dot: 'bg-white/30',
    },
]

export function SubmitFormPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState('')
    const [interest, setInterest] = useState<Interest>(null)
    const [interestOther, setInterestOther] = useState('')
    const [commitment, setCommitment] = useState<Commitment>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isValid =
        firstName.trim() &&
        lastName.trim() &&
        email.trim() &&
        interest &&
        commitment &&
        (interest !== 'other' || interestOther.trim())

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid || submitting) return

        setSubmitting(true)
        setError(null)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any).from('form_submissions').insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || null,
            role: role || null,
            interest,
            interest_other: interest === 'other' ? interestOther.trim() : null,
            commitment,
        })

        if (insertError) {
            setError('Something went wrong. Please try again.')
            setSubmitting(false)
            return
        }

        setSubmitted(true)
        setSubmitting(false)
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-md"
                >
                    <div className="h-16 w-16 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-8 w-8 text-lime" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">You're in the queue.</h2>
                    <p className="text-gray-400 leading-relaxed mb-8">
                        We received your application. Our team reviews every submission personally —
                        expect a response within 48 hours.
                    </p>
                    <a
                        href="/test-landingpage"
                        className="inline-flex items-center gap-2 text-sm text-lime hover:text-lime/80 transition"
                    >
                        ← Back to Zkandar AI
                    </a>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav strip */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-lime flex items-center justify-center">
                        <span className="text-black font-black text-xs">Z</span>
                    </div>
                    <span className="font-semibold tracking-tight text-white">Zkandar AI</span>
                </a>
                <span className="text-xs text-gray-500 hidden sm:block">Application Form</span>
            </div>

            {/* Page content */}
            <div className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-20">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <p className="text-xs font-bold tracking-widest text-lime/70 uppercase mb-3">Apply Now</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                        Start your AI design journey.
                    </h1>
                    <p className="text-gray-400">
                        Tell us about yourself and where you want to go. We'll find the right path in.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* ── SECTION 1: About You ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="01" label="About You" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="First Name"
                                value={firstName}
                                onChange={setFirstName}
                                placeholder="Ahmad"
                                required
                            />
                            <Field
                                label="Last Name"
                                value={lastName}
                                onChange={setLastName}
                                placeholder="Al Mansoori"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="Email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="you@studio.com"
                                required
                            />
                            <Field
                                label="Phone"
                                type="tel"
                                value={phone}
                                onChange={setPhone}
                                placeholder="+971 50 000 0000"
                            />
                        </div>

                        {/* Role dropdown */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Your Role
                            </label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/40 transition-colors pr-10"
                                >
                                    <option value="">Select your role</option>
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </motion.div>

                    {/* ── SECTION 2: What You're After ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="02" label="What You're After" />

                        <div className="space-y-3">
                            {INTEREST_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setInterest(opt.id)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
                                        interest === opt.id
                                            ? 'border-lime/50 bg-lime/5'
                                            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-white text-sm">{opt.title}</span>
                                                <span className={`text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                                                    interest === opt.id
                                                        ? 'text-lime border-lime/30 bg-lime/10'
                                                        : 'text-gray-500 border-white/[0.08]'
                                                }`}>
                                                    {opt.tag}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs leading-relaxed mb-2">{opt.description}</p>
                                            <p className={`text-[11px] font-medium ${interest === opt.id ? 'text-lime/70' : 'text-gray-600'}`}>
                                                {opt.detail}
                                            </p>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                            interest === opt.id ? 'border-lime bg-lime' : 'border-white/20'
                                        }`}>
                                            {interest === opt.id && (
                                                <div className="h-2 w-2 rounded-full bg-black" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {interest === 'other' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-1">
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                            Tell us more
                                        </label>
                                        <textarea
                                            value={interestOther}
                                            onChange={(e) => setInterestOther(e.target.value)}
                                            placeholder="Describe what you have in mind..."
                                            rows={3}
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── SECTION 3: Commitment Level ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="03" label="Where You're At" />

                        <div className="space-y-3">
                            {COMMITMENT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setCommitment(opt.id)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                                        commitment === opt.id ? opt.activeColor : opt.color
                                    }`}
                                >
                                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.dot} ${commitment === opt.id ? 'opacity-100' : 'opacity-40'}`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">{opt.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                                        commitment === opt.id ? 'border-lime bg-lime' : 'border-white/20'
                                    }`}>
                                        {commitment === opt.id && (
                                            <div className="h-2 w-2 rounded-full bg-black" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── SUBMIT ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="pt-2"
                    >
                        {error && (
                            <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="w-full py-4 rounded-2xl gradient-lime text-black font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
                            ) : (
                                <>Submit Application <ArrowRight className="h-5 w-5" /></>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-600 mt-4">
                            We read every submission. You'll hear back within 48 hours.
                        </p>
                    </motion.div>

                </form>
            </div>
        </div>
    )
}

function SectionLabel({ number, label }: { number: string; label: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-black text-lime/40">{number}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    )
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    required,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: string
    required?: boolean
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                {label}{required && <span className="text-lime ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
            />
        </div>
    )
}
