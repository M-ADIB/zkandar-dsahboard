import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2, ChevronDown, Instagram, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import logoSrc from '../../assets/logo.png'

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

const DESIGNATIONS = [
    'Design Director / Creative Director',
    'Principal / Partner',
    'Senior Architect / Senior Designer',
    'Project Manager',
    'Junior Architect / Junior Designer',
    'Intern / Graduate',
    'Freelancer / Independent',
    'Other',
]

const INTEREST_OPTIONS = [
    {
        id: 'masterclass' as const,
        title: 'AI Masterclass',
        tag: 'FOR CORPORATE TEAMS',
        description: 'A complete AI transformation for your firm. We come in, build the system, and leave your team certified.',
        detail: 'Intensive boot camp · Team of 3–12 · Live sessions + async work',
    },
    {
        id: 'sprint' as const,
        title: 'Sprint Workshop',
        tag: 'FOR INDIVIDUALS',
        description: 'Go from zero to AI-fluent in days, not months. Intensive, hands-on, output-focused.',
        detail: '3-Day Sprint Program · Real deliverables by day 3',
    },
    {
        id: 'other' as const,
        title: 'Something Else',
        tag: 'TELL US',
        description: 'If the idea is sharp, we want to hear it.',
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
        sub: 'I\'m in the right direction but want to confirm this fits before committing.',
        color: 'border-white/10 bg-white/[0.02] hover:border-white/20',
        activeColor: 'border-white/30 bg-white/[0.05]',
        dot: 'bg-white/50',
    },
    {
        id: 'exploring' as const,
        label: 'Not quite ready.',
        sub: 'I\'m early in the process. Keep me in the loop.',
        color: 'border-white/10 bg-white/[0.02] hover:border-white/20',
        activeColor: 'border-white/30 bg-white/[0.05]',
        dot: 'bg-white/30',
    },
]

function getValidationErrors({
    firstName,
    lastName,
    email,
    phone,
    role,
    designation,
    designationOther,
    interest,
    interestOther,
    commitment,
}: {
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    designation: string
    designationOther: string
    interest: Interest
    interestOther: string
    commitment: Commitment
}): string[] {
    const errors: string[] = []
    if (!firstName.trim()) errors.push('We need your first name — just your first one is fine!')
    if (!lastName.trim()) errors.push('Don\'t forget your last name!')
    if (!email.trim()) errors.push('We need your email so we can reach you.')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('That email doesn\'t look right. Double-check it?')
    if (!phone.trim()) errors.push('Your phone number is required — we may need to reach you quickly.')
    if (!role) errors.push('Tell us your role — pick the one that fits best!')
    if (!designation) errors.push('What\'s your designation? Pick the closest one from the list.')
    if (designation === 'Other' && !designationOther.trim()) errors.push('You picked "Other" for designation — what is it exactly?')
    if (!interest) errors.push('Which program are you interested in? Pick one above.')
    if (interest === 'other' && !interestOther.trim()) errors.push('You said "Something Else" — tell us what you have in mind!')
    if (!commitment) errors.push('Almost there! Just tell us where you\'re at in your decision.')
    return errors
}

export function SubmitFormPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState('')
    const [designation, setDesignation] = useState('')
    const [designationOther, setDesignationOther] = useState('')
    const [companyInstagram, setCompanyInstagram] = useState('')
    const [personalInstagram, setPersonalInstagram] = useState('')
    const [interest, setInterest] = useState<Interest>(null)
    const [interestOther, setInterestOther] = useState('')
    const [commitment, setCommitment] = useState<Commitment>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submitting) return

        const errors = getValidationErrors({
            firstName, lastName, email, phone, role,
            designation, designationOther,
            interest, interestOther, commitment,
        })

        if (errors.length > 0) {
            setValidationErrors(errors)
            document.getElementById('validation-errors')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        setValidationErrors([])
        setSubmitting(true)
        setError(null)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any).from('form_submissions').insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || null,
            role: role || null,
            designation: designation || null,
            designation_other: designation === 'Other' ? designationOther.trim() : null,
            company_instagram: companyInstagram.trim() || null,
            personal_instagram: personalInstagram.trim() || null,
            interest,
            interest_other: interest === 'other' ? interestOther.trim() : null,
            commitment,
        })

        if (insertError) {
            setError('Something went wrong. Please try again.')
            setSubmitting(false)
            return
        }

        // Route based on interest + commitment
        if (interest === 'masterclass') {
            window.location.href = 'https://calendly.com/zkandar/masterclass'
        } else if (interest === 'sprint') {
            if (commitment === 'ready') {
                window.location.href = '/enroll'
            } else if (commitment === 'curious') {
                window.location.href = '/checkout?questions=true'
            } else {
                // exploring / not quite ready — send to conviction page
                window.location.href = '/not-sure'
            }
        } else {
            setSubmitted(true)
        }
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
                    <h2 className="font-heading font-black uppercase text-2xl text-white mb-3">You're in the queue.</h2>
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
        <div className="min-h-screen bg-black text-white font-body">
            {/* Nav strip */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-3.5 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                    <div className="w-px h-4 bg-white/[0.12] hidden sm:block" />
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-600 hidden sm:block">kind of AI</span>
                </a>
                <span className="text-[0.6875rem] text-gray-600 hidden sm:block uppercase tracking-[0.15em]">Application Form</span>
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
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">Apply Now</p>
                    <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3rem)] leading-[0.95] text-white mb-3">
                        Start your AI<br /><span className="text-lime">design journey.</span>
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
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
                            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" required />
                            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Last name" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@studio.com" required />
                            <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+971 50 000 0000" required />
                        </div>

                        {/* Instagram fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                    Company Instagram
                                    <span className="ml-1.5 text-[10px] normal-case text-gray-600 tracking-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={companyInstagram}
                                        onChange={(e) => setCompanyInstagram(e.target.value)}
                                        placeholder="@yourstudio"
                                        className="w-full bg-white/[0.06] border border-white/[0.15] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                    Personal Instagram
                                    <span className="ml-1.5 text-[10px] normal-case text-gray-600 tracking-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={personalInstagram}
                                        onChange={(e) => setPersonalInstagram(e.target.value)}
                                        placeholder="@yourhandle"
                                        className="w-full bg-white/[0.06] border border-white/[0.15] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── SECTION 2: Your Role & Designation ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="02" label="Your Role" />

                        {/* Role dropdown */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                What do you do? <span className="text-lime">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full appearance-none bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/40 transition-colors pr-10"
                                >
                                    <option value="">Select your role</option>
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Designation dropdown */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Your Designation <span className="text-lime">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={designation}
                                    onChange={(e) => { setDesignation(e.target.value); setDesignationOther('') }}
                                    className="w-full appearance-none bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime/40 transition-colors pr-10"
                                >
                                    <option value="">Your position within the company</option>
                                    {DESIGNATIONS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                            <AnimatePresence>
                                {designation === 'Other' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <input
                                            type="text"
                                            value={designationOther}
                                            onChange={(e) => setDesignationOther(e.target.value)}
                                            placeholder="Describe your designation"
                                            className="mt-2 w-full bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* ── SECTION 3: What You're After ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="03" label="What You're After" />

                        <div className="space-y-3">
                            {INTEREST_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setInterest(opt.id)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
                                        interest === opt.id
                                            ? 'border-lime/50 bg-lime/[0.06]'
                                            : 'border-white/[0.12] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-heading font-black uppercase text-sm text-white tracking-wide">{opt.title}</span>
                                                <span className={`text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                                                    interest === opt.id
                                                        ? 'text-lime border-lime/30 bg-lime/10'
                                                        : 'text-gray-500 border-white/[0.12]'
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
                                            className="w-full bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── SECTION 4: Commitment Level ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <SectionLabel number="04" label="Where You're At" />

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
                        {/* Validation errors */}
                        <AnimatePresence>
                            {validationErrors.length > 0 && (
                                <motion.div
                                    id="validation-errors"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mb-6 bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-5"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                                        <p className="text-sm font-semibold text-red-300">
                                            {validationErrors.length === 1
                                                ? 'One thing is missing:'
                                                : `${validationErrors.length} things need your attention:`}
                                        </p>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {validationErrors.map((err, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-red-300/80">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400/60 shrink-0" />
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl gradient-lime text-black font-body font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            <span className="text-xs font-black text-lime/40 font-heading">{number}</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[0.6875rem] font-body font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</span>
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
                className="w-full bg-white/[0.06] border border-white/[0.15] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
            />
        </div>
    )
}
