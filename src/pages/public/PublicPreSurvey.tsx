import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Users, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// The 3 enrolled companies — autocomplete source
const KNOWN_COMPANIES = [
    { id: 'b5329df4-1664-4d17-bcbc-f96a2f847a70', name: 'Finasi' },
    { id: 'd95798af-a652-425d-8e0e-6d7bc6ef8369', name: 'Knowndesign' },
    { id: 'e6e1cc5c-be81-4fa7-8dd5-ecd1b0cc9b68', name: 'Reviespaces' },
]

// =============================================
// TEAM QUESTIONS
// =============================================
const teamQuestions = [
    // Section 1: Role & Experience Context
    {
        id: 'role',
        section: 'Role & Experience Context',
        text: 'What best describes your current role?',
        type: 'radio' as const,
        required: true,
        options: ['Interior Designer', 'Architect', 'Visualizer', 'Junior Designer', 'Senior Designer', 'BIM / Technical', 'Other'],
    },
    {
        id: 'experience_years',
        section: 'Role & Experience Context',
        text: 'How many years of professional experience do you have?',
        type: 'radio' as const,
        required: true,
        options: ['0–2 years', '3–5 years', '6–10 years', '10+ years'],
    },
    // Section 2: Current AI Usage
    {
        id: 'current_ai_usage',
        section: 'Current AI Usage',
        text: 'Are you currently using AI tools in your design or visualization workflow?',
        type: 'radio' as const,
        required: true,
        options: ['Not at all', 'Occasionally experimenting', 'Regularly for internal concept work', 'Regularly for client-facing outputs'],
    },
    {
        id: 'ai_tools_used',
        section: 'Current AI Usage',
        text: 'Which AI tools have you personally used before?',
        type: 'checkbox' as const,
        required: true,
        options: ['Midjourney', 'KREA', 'Nano Banana', 'ChatGPT', 'Higgsfield', 'Other', 'None of the above'],
    },
    // Section 3: Confidence & Skill Baseline  
    {
        id: 'ai_confidence',
        section: 'Confidence & Skill Baseline',
        text: 'How confident do you currently feel using AI tools in your workflow?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident at all', 'Very confident'],
    },
    {
        id: 'ai_skill_level',
        section: 'Confidence & Skill Baseline',
        text: 'How would you rate your current skill level with AI image or concept tools?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Beginner', 'Advanced'],
    },
    // Section 4: Workflow Friction & Challenges
    {
        id: 'workflow_difficulties',
        section: 'Workflow Friction & Challenges',
        text: 'Where do you experience the most difficulty or frustration when using AI tools?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Getting strong concepts or ideas', 'Creating mood or storytelling visuals', 'Controlling style and consistency', 'Iterating efficiently', 'Handling feedback or revisions', 'Translating AI ideas into real design work'],
    },
    {
        id: 'quality_confidence',
        section: 'Workflow Friction & Challenges',
        text: "How confident are you that your current AI outputs meet your studio's quality and brand standards?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    // Section 5: Quality, Brand & Concerns
    {
        id: 'ai_concerns',
        section: 'Quality, Brand & Concerns',
        text: 'What concerns, if any, do you personally have about using AI in your work?',
        type: 'checkbox' as const,
        required: true,
        options: ['Loss of creative authorship', 'Inconsistent quality', 'Difficulty controlling results', 'Client perception of AI', 'Brand or style misalignment', 'Data or IP concerns', 'I have no major concerns'],
    },
    // Section 6: Learning Needs & Adoption
    {
        id: 'learning_needs',
        section: 'Learning Needs & Adoption',
        text: 'What would help you most to use AI more confidently and effectively?',
        type: 'checkbox' as const,
        required: true,
        options: ['Clear workflows and examples', 'Better prompting techniques', 'Understanding how to refine and control results', 'Knowing what is safe for client use', 'Seeing real project examples'],
    },
    {
        id: 'workflow_readiness',
        section: 'Learning Needs & Adoption',
        text: 'How ready do you feel to use AI as part of your regular workflow today?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not ready', 'Fully ready'],
    },
    // Section 7: Masterclass Expectations
    {
        id: 'masterclass_goals',
        section: 'Masterclass Expectations',
        text: 'What are your top goals for participating in this masterclass?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Generate concepts faster', 'Improve visual quality', 'Gain more control over AI results', 'Reduce revision time', 'Learn structured AI workflows', 'Build confidence using AI tools'],
    },
    {
        id: 'success_definition',
        section: 'Masterclass Expectations',
        text: 'At the end of the masterclass, what would success look like for you personally?',
        type: 'text' as const,
        required: true,
        placeholder: 'Describe what success looks like for you...',
    },
    // Section 8: Project Context (Optional)
    {
        id: 'project_context',
        section: 'Project Context (Optional)',
        text: 'Is there a specific project type, phase, or task where you would like to apply AI more effectively?',
        type: 'text' as const,
        required: false,
        placeholder: 'Optional: Describe a project or task...',
    },
]

// =============================================
// MANAGEMENT QUESTIONS
// =============================================
const managementQuestions = [
    // Section 1: Role & Studio Context
    {
        id: 'leadership_role',
        section: 'Role & Studio Context',
        text: 'What best describes your role within the studio?',
        type: 'radio' as const,
        required: true,
        options: ['Partner / Director', 'Head of Design', 'Studio Lead', 'Associate Director', 'Other senior leadership role'],
    },
    {
        id: 'studio_focus',
        section: 'Role & Studio Context',
        text: "What best describes your studio's primary focus?",
        type: 'radio' as const,
        required: true,
        options: ['Architecture', 'Interior Design', 'Other'],
    },
    // Section 2: Current AI Adoption
    {
        id: 'studio_ai_usage',
        section: 'Current AI Adoption (Leadership View)',
        text: "How would you describe your studio's current use of AI in design workflows?",
        type: 'radio' as const,
        required: true,
        options: ['Not in use', 'Informal experimentation by individuals', 'Structured internal use for concept design', 'Regular use including client-facing outputs'],
    },
    {
        id: 'ai_visibility',
        section: 'Current AI Adoption (Leadership View)',
        text: 'At a leadership level, how clear is your visibility on how AI is currently being used by your teams?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['No visibility', 'Very clear visibility'],
    },
    // Section 3: Strategic Drivers & Friction
    {
        id: 'ai_opportunities',
        section: 'Strategic Drivers & Friction',
        text: 'From a management perspective, where do you see the greatest opportunity for AI to impact the studio?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Faster concept development', 'Improved visual quality', 'Greater design consistency', 'Reduced revision cycles', 'Better use of team time', 'Competitive differentiation'],
    },
    {
        id: 'ai_risks',
        section: 'Strategic Drivers & Friction',
        text: 'Where do you see the greatest risk or friction in AI adoption today?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Inconsistent output quality', 'Brand or design misalignment', 'Client perception or trust', 'Loss of authorship or creative control', 'Lack of clear guidelines', 'Data or IP concerns'],
    },
    // Section 4: Quality, Brand & Governance
    {
        id: 'brand_confidence',
        section: 'Quality, Brand & Governance',
        text: "How confident are you that AI outputs currently align with your studio's design standards and brand positioning?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    {
        id: 'ai_guidance',
        section: 'Quality, Brand & Governance',
        text: 'Does your studio currently have any formal guidance or rules around AI usage?',
        type: 'radio' as const,
        required: true,
        options: ['No formal guidance', 'Informal verbal guidance', 'Partial written guidelines', 'Clear written AI standards'],
    },
    // Section 5: Adoption & Enablement
    {
        id: 'adoption_factor',
        section: 'Adoption & Enablement',
        text: 'What do you believe is the single most important factor for successful AI adoption across your studio?',
        type: 'radio' as const,
        required: true,
        options: ['Clear workflows and use cases', 'Quality control frameworks', 'Management-led direction', 'Training and upskilling', 'Proven project examples'],
    },
    {
        id: 'team_readiness',
        section: 'Adoption & Enablement',
        text: 'How ready do you believe your teams are to adopt AI in a structured and repeatable way?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not ready', 'Fully ready'],
    },
    // Section 6: Business & Competitive Impact - Matrix
    {
        id: 'business_impact',
        section: 'Business & Competitive Impact',
        text: 'To what extent do you believe AI adoption could impact the following areas?',
        type: 'matrix' as const,
        required: true,
        matrixItems: ['Speed of delivery', 'Design quality', 'Team efficiency', 'Client satisfaction', 'Competitive advantage'],
        scaleLabels: ['No impact', 'Significant impact'],
    },
    // Section 7: Masterclass Objectives
    {
        id: 'leadership_objectives',
        section: 'Masterclass Objectives',
        text: 'What are your top objectives for this masterclass?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Establish clear AI workflows', 'Improve output quality and consistency', 'Enable safe client-facing AI use', 'Upskill teams efficiently', 'Define studio-wide AI standards'],
    },
    {
        id: 'leadership_success',
        section: 'Masterclass Objectives',
        text: 'At the end of the masterclass, what would success look like from a leadership perspective?',
        type: 'text' as const,
        required: true,
        placeholder: 'Describe what success looks like from a leadership perspective...',
    },
    // Section 8: Reference Projects
    {
        id: 'work_type',
        section: 'Reference Projects & Strategic Relevance',
        text: 'Which type of work best represents where you want AI to add the most value?',
        type: 'radio' as const,
        required: true,
        options: ['Luxury residential', 'Hospitality (hotel, resort, F&B)', 'Workplace / commercial', 'Landscape', 'Mixed-use / large-scale', 'Concept-driven / competition work'],
    },
    {
        id: 'reference_value',
        section: 'Reference Projects & Strategic Relevance',
        text: 'If we reference a real project during the masterclass, what would be most valuable for leadership to see?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: ['Clear AI-to-design workflow', 'Quality control checkpoints', 'Brand consistency in AI outputs', 'Client-ready use cases', 'Governance and standards in action'],
    },
]

type SurveyType = 'team' | 'management'

export function PublicPreSurvey() {
    const [step, setStep] = useState(0) // 0 = type select, 1 = basic info, 2+ = questions
    const [surveyType, setSurveyType] = useState<SurveyType | null>(null)
    const [basicInfo, setBasicInfo] = useState({ full_name: '', email: '', company_name: '' })
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [companySuggestions, setCompanySuggestions] = useState<typeof KNOWN_COMPANIES>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const companyInputRef = useRef<HTMLInputElement>(null)
    const [answers, setAnswers] = useState<Record<string, string | string[] | number | Record<string, number>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleCompanyInput = (value: string) => {
        setBasicInfo(prev => ({ ...prev, company_name: value }))
        setCompanyId(null)
        if (value.length >= 2) {
            const matches = KNOWN_COMPANIES.filter(c =>
                c.name.toLowerCase().startsWith(value.toLowerCase())
            )
            setCompanySuggestions(matches)
            setShowSuggestions(matches.length > 0)
        } else {
            setCompanySuggestions([])
            setShowSuggestions(false)
        }
    }

    const selectCompany = (company: typeof KNOWN_COMPANIES[0]) => {
        setBasicInfo(prev => ({ ...prev, company_name: company.name }))
        setCompanyId(company.id)
        setShowSuggestions(false)
    }

    const questions = surveyType === 'management' ? managementQuestions : teamQuestions
    const totalSteps = 2 + questions.length

    const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps - 1))
    const handleBack = () => setStep(prev => Math.max(prev - 1, 0))

    const canProceed = () => {
        if (step === 0) return surveyType !== null
        if (step === 1) {
            return basicInfo.full_name.trim().length > 1 && basicInfo.email.includes('@') && basicInfo.company_name.trim().length > 1
        }
        const questionIndex = step - 2
        if (questionIndex >= 0 && questionIndex < questions.length) {
            const q = questions[questionIndex]
            if (!q.required) return true
            const answer = answers[q.id]
            if (answer === undefined || answer === null || answer === '') return false
            if (Array.isArray(answer) && answer.length === 0) return false
            if (q.type === 'matrix') {
                const matrixAnswer = answer as Record<string, number>
                return q.matrixItems ? Object.keys(matrixAnswer).length === q.matrixItems.length : false
            }
        }
        return true
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Resolve company_id if not already matched (exact name fallback)
            let resolvedCompanyId = companyId
            if (!resolvedCompanyId) {
                const match = KNOWN_COMPANIES.find(
                    c => c.name.toLowerCase() === basicInfo.company_name.toLowerCase()
                )
                resolvedCompanyId = match?.id ?? null
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('pre_completion_survey_responses')
                .insert({
                    survey_type: surveyType,
                    respondent_name: basicInfo.full_name,
                    respondent_email: basicInfo.email,
                    company_name: basicInfo.company_name,
                    company_id: resolvedCompanyId,
                    answers,
                })
            if (error) throw error
            setSubmitted(true)
        } catch (err) {
            console.error(err)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isLastStep = step === totalSteps - 1

    // =============================================
    // RENDER: Thank You Screen
    // =============================================
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-lg text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-20 w-20 mx-auto rounded-full gradient-lime flex items-center justify-center mb-6"
                    >
                        <CheckCircle2 className="h-10 w-10 text-black" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-text text-3xl mb-4"
                    >
                        Thank you!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="text-gray-400 text-lg mb-6"
                    >
                        Your response has been recorded. We appreciate you taking the time to share your expectations and context.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-sm"
                    >
                        <Sparkles className="h-4 w-4" />
                        Zkandar AI
                    </motion.div>
                </div>
            </div>
        )
    }

    // =============================================
    // RENDER: Step 0 — Survey Type Selection
    // =============================================
    if (step === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl relative z-10"
                >
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-sm mb-6">
                            <Sparkles className="h-4 w-4" />
                            Zkandar AI
                        </div>
                        <h1 className="hero-text text-4xl mb-4">Pre-Masterclass Context Survey</h1>
                        <p className="text-gray-400 text-lg">
                            Help us understand your context and expectations so we can tailor the content.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSurveyType('team')}
                            className={`p-8 rounded-2xl border-2 transition-all text-left ${surveyType === 'team' ? 'border-lime bg-lime/10' : 'border-border bg-bg-card hover:border-lime/50'}`}
                        >
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${surveyType === 'team' ? 'gradient-lime' : 'bg-bg-elevated'}`}>
                                <Users className={`h-7 w-7 ${surveyType === 'team' ? 'text-black' : 'text-gray-400'}`} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Team Member</h3>
                            <p className="text-gray-400 text-sm">Designer, Architect, Visualizer, or Technical staff participating in the masterclass</p>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSurveyType('management')}
                            className={`p-8 rounded-2xl border-2 transition-all text-left ${surveyType === 'management' ? 'border-lime bg-lime/10' : 'border-border bg-bg-card hover:border-lime/50'}`}
                        >
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${surveyType === 'management' ? 'gradient-lime' : 'bg-bg-elevated'}`}>
                                <Briefcase className={`h-7 w-7 ${surveyType === 'management' ? 'text-black' : 'text-gray-400'}`} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Top Management</h3>
                            <p className="text-gray-400 text-sm">Director, Partner, Studio Lead, or other senior leadership role</p>
                        </motion.button>
                    </div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: surveyType ? 1 : 0.5 }}
                        onClick={handleNext}
                        disabled={!surveyType}
                        className="w-full mt-8 py-4 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Continue
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                </motion.div>
            </div>
        )
    }

    // =============================================
    // RENDER: Step 1 — Basic Info
    // =============================================
    if (step === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-xl relative z-10 bg-bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-2xl"
                >
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Step 2 of {totalSteps}</span>
                            <span>{Math.round((2 / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(2 / totalSteps) * 100}%` }}
                                className="h-full gradient-lime"
                            />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-6 text-white">Your Details</h2>
                    <p className="text-gray-400 text-sm mb-6">We'll use this alongside your survey responses to tailor our material for your specific workflows.</p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Full Name *</label>
                            <input
                                type="text"
                                value={basicInfo.full_name}
                                onChange={e => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Email *</label>
                            <input
                                type="email"
                                value={basicInfo.email}
                                onChange={e => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors text-white"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium mb-2 text-gray-300">Company / Studio Name *</label>
                            <input
                                ref={companyInputRef}
                                type="text"
                                value={basicInfo.company_name}
                                onChange={e => handleCompanyInput(e.target.value)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                onFocus={() => {
                                    if (basicInfo.company_name.length >= 2 && companySuggestions.length > 0)
                                        setShowSuggestions(true)
                                }}
                                placeholder="Start typing your company name..."
                                autoComplete="off"
                                className={`w-full px-4 py-3 bg-bg-elevated border rounded-xl text-white focus:outline-none transition-colors ${companyId ? 'border-lime/60' : 'border-border focus:border-lime/50'
                                    }`}
                            />
                            {companyId && (
                                <span className="absolute right-4 top-1/2 translate-y-[8px] text-lime text-xs font-medium">✓ Matched</span>
                            )}
                            <AnimatePresence>
                                {showSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute z-50 w-full mt-1 bg-bg-elevated border border-border rounded-xl overflow-hidden shadow-xl"
                                    >
                                        {companySuggestions.map(company => (
                                            <button
                                                key={company.id}
                                                type="button"
                                                onMouseDown={() => selectCompany(company)}
                                                className="w-full px-4 py-3 text-left hover:bg-lime/10 hover:text-lime transition-colors flex items-center justify-between group"
                                            >
                                                <span className="text-white">{company.name}</span>
                                                <span className="text-xs text-gray-500 group-hover:text-lime/70">Select →</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 border border-border text-white rounded-xl hover:border-lime/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // =============================================
    // RENDER: Steps 2+ — Survey Questions
    // =============================================
    const questionIndex = step - 2
    const currentQuestion = questions[questionIndex]
    const sections = [...new Set(questions.map(q => q.section))]
    const currentSectionIndex = sections.indexOf(currentQuestion?.section || '')

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-2xl text-white relative z-10"
                >
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-bg-card rounded-full overflow-hidden border border-border">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                                className="h-full gradient-lime"
                            />
                        </div>
                        <p className="text-lime text-sm mt-2">{currentQuestion?.section}</p>
                    </div>

                    {/* Question */}
                    <h2 className="text-xl font-bold mb-6">
                        {currentQuestion?.text}
                        {currentQuestion?.required && <span className="text-red-400 ml-1">*</span>}
                    </h2>
                    {currentQuestion?.maxSelections && (
                        <p className="text-gray-500 text-sm mb-4">Select up to {currentQuestion.maxSelections}</p>
                    )}

                    {/* Answer Inputs */}
                    <div className="space-y-3">

                        {/* Radio */}
                        {currentQuestion?.type === 'radio' && currentQuestion.options?.map(option => (
                            <button
                                key={option}
                                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${answers[currentQuestion.id] === option ? 'border-lime bg-lime/10' : 'border-border bg-bg-card hover:border-lime/50'}`}
                            >
                                {option}
                            </button>
                        ))}

                        {/* Checkbox */}
                        {currentQuestion?.type === 'checkbox' && currentQuestion.options?.map(option => {
                            const currentAnswers = (answers[currentQuestion.id] as string[]) || []
                            const isSelected = currentAnswers.includes(option)
                            const maxReached = !!(currentQuestion.maxSelections && currentAnswers.length >= currentQuestion.maxSelections)
                            return (
                                <button
                                    key={option}
                                    onClick={() => {
                                        if (isSelected) {
                                            setAnswers(prev => ({ ...prev, [currentQuestion.id]: currentAnswers.filter(a => a !== option) }))
                                        } else if (!maxReached) {
                                            setAnswers(prev => ({ ...prev, [currentQuestion.id]: [...currentAnswers, option] }))
                                        }
                                    }}
                                    disabled={!isSelected && maxReached}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-lime bg-lime/10' : maxReached ? 'border-border bg-bg-card opacity-50 cursor-not-allowed' : 'border-border bg-bg-card hover:border-lime/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-lime bg-lime' : 'border-gray-500'}`}>
                                            {isSelected && <CheckCircle2 className="h-3 w-3 text-black" />}
                                        </div>
                                        {option}
                                    </div>
                                </button>
                            )
                        })}

                        {/* Scale */}
                        {currentQuestion?.type === 'scale' && (
                            <div className="py-4">
                                <div className="flex justify-between text-sm text-gray-500 mb-4">
                                    <span>{currentQuestion.scaleLabels?.[0]}</span>
                                    <span>{currentQuestion.scaleLabels?.[1]}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: rating }))}
                                            className={`flex-1 aspect-square rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${answers[currentQuestion.id] === rating ? 'border-lime bg-lime/10 text-lime' : 'border-border bg-bg-card hover:border-lime/50'}`}
                                        >
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Matrix */}
                        {currentQuestion?.type === 'matrix' && (
                           <div className="space-y-6">
                               <div className="flex justify-between text-sm text-gray-500 pb-2 border-b border-white/5">
                                   <span>{currentQuestion.scaleLabels?.[0]}</span>
                                   <span>{currentQuestion.scaleLabels?.[1]}</span>
                               </div>
                               {currentQuestion.matrixItems?.map((item) => (
                                   <div key={item} className="space-y-3 bg-white/5 p-4 rounded-xl">
                                       <p className="font-medium text-sm text-white/90">{item}</p>
                                       <div className="flex justify-between gap-2">
                                           {[1, 2, 3, 4, 5].map(rating => {
                                               const currentMatrix = (answers[currentQuestion.id] as Record<string, number>) || {}
                                               const isSelected = currentMatrix[item] === rating
                                               return (
                                                   <button
                                                       key={rating}
                                                       onClick={() => {
                                                           setAnswers(prev => ({
                                                               ...prev,
                                                               [currentQuestion.id]: {
                                                                   ...((prev[currentQuestion.id] as Record<string, number>) || {}),
                                                                   [item]: rating
                                                               }
                                                           }))
                                                       }}
                                                       className={`flex-1 aspect-square md:aspect-auto md:py-2 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                                                           isSelected
                                                               ? 'border-lime bg-lime/10 text-lime'
                                                               : 'border-border bg-white/[0.02] hover:border-lime/50 text-gray-400'
                                                       }`}
                                                   >
                                                       {rating}
                                                   </button>
                                               )
                                           })}
                                       </div>
                                   </div>
                               ))}
                           </div>
                        )}

                        {/* Text */}
                        {currentQuestion?.type === 'text' && (
                            <textarea
                                value={(answers[currentQuestion.id] as string) || ''}
                                onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                placeholder={currentQuestion.placeholder}
                                rows={4}
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 border border-border rounded-xl hover:border-lime/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Back
                        </button>
                        {isLastStep ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProceed() || isSubmitting}
                                className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                                {!isSubmitting && <CheckCircle2 className="h-5 w-5" />}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continue
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
