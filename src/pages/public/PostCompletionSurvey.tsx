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
// TEAM QUESTIONS (from Post-Masterclass Impact Survey — Team Participants)
// =============================================
const teamQuestions = [
    // Section 1: Overall Experience
    {
        id: 'overall_value',
        section: 'Overall Experience',
        text: 'Overall, how valuable was this masterclass for you personally?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not valuable at all', 'Extremely valuable'],
    },
    {
        id: 'content_relevance',
        section: 'Overall Experience',
        text: 'How relevant was the masterclass content to your day-to-day work?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not relevant', 'Extremely relevant'],
    },
    // Section 2: Confidence & Skill Shift
    {
        id: 'post_ai_confidence',
        section: 'Confidence & Skill Shift',
        text: 'How confident do you now feel using AI tools in your workflow?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    {
        id: 'post_ai_skill',
        section: 'Confidence & Skill Shift',
        text: 'How would you rate your current overall skill level with AI tools after the masterclass?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Beginner', 'Advanced'],
    },
    {
        id: 'confidence_change',
        section: 'Confidence & Skill Shift',
        text: 'Compared to before the masterclass, how has your confidence using AI changed?',
        type: 'radio' as const,
        required: true,
        options: ['Significantly decreased', 'Slightly decreased', 'No change', 'Slightly increased', 'Significantly increased'],
    },
    // Section 3: Workflow Impact
    {
        id: 'workflow_impact',
        section: 'Workflow Impact',
        text: 'To what extent has the masterclass improved the following areas of your workflow?',
        type: 'matrix' as const,
        required: true,
        matrixItems: [
            'Design iteration speed',
            'Concept ideation',
            'Mood and storytelling visuals',
            'Visual consistency and control',
            'Handling feedback and revisions',
            'Translating AI ideas into real design work',
        ],
        scaleLabels: ['No improvement', 'Significant improvement'],
    },
    // Section 4: Quality & Control
    {
        id: 'quality_confidence',
        section: 'Quality & Control',
        text: "How confident are you now that your AI outputs meet your studio's quality and brand standards?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    {
        id: 'control_change',
        section: 'Quality & Control',
        text: 'Compared to before the masterclass, how much control do you feel you now have over AI-generated results?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Much less control', 'Much more control'],
    },
    {
        id: 'remaining_concerns',
        section: 'Quality & Control',
        text: 'Which concerns, if any, still remain for you?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: [
            'Loss of creative authorship',
            'Inconsistent quality',
            'Difficulty controlling results',
            'Client perception of AI',
            'Brand or style misalignment',
            'Data or IP concerns',
            'No major remaining concerns',
        ],
    },
    // Section 5: Adoption Readiness
    {
        id: 'internal_use_likelihood',
        section: 'Adoption Readiness',
        text: 'How likely are you to use AI tools for internal concept work after this masterclass?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Very unlikely', 'Very likely'],
    },
    {
        id: 'client_use_likelihood',
        section: 'Adoption Readiness',
        text: 'How likely are you to use AI tools for client-facing outputs after this masterclass?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Very unlikely', 'Very likely'],
    },
    {
        id: 'workflow_readiness',
        section: 'Adoption Readiness',
        text: 'How ready do you feel to apply the demonstrated AI workflows immediately in your work?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not ready', 'Fully ready'],
    },
    // Section 6: Success Validation
    {
        id: 'goals_achieved',
        section: 'Success Validation',
        text: 'Were your personal goals for this masterclass achieved?',
        type: 'radio' as const,
        required: true,
        options: ['Yes', 'Partially', 'No'],
    },
    {
        id: 'outcomes_experienced',
        section: 'Success Validation',
        text: 'Which of the following outcomes did you personally experience as a result of the masterclass?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: [
            'Faster concept generation',
            'Higher quality visual output',
            'More control over AI results',
            'Reduced revision time',
            'Clearer AI workflows',
            'Increased confidence using AI',
        ],
    },
    // Section 7: Net Outcome & Reflection
    {
        id: 'overall_success',
        section: 'Net Outcome & Reflection',
        text: 'Overall, how successful was this masterclass for you?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not successful', 'Extremely successful'],
    },
    {
        id: 'recommend_likelihood',
        section: 'Net Outcome & Reflection',
        text: 'How likely are you to recommend this masterclass to a colleague?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Very unlikely', 'Very likely'],
    },
    {
        id: 'most_valuable',
        section: 'Net Outcome & Reflection',
        text: 'In one sentence, what was the most valuable thing you gained from this masterclass?',
        type: 'text' as const,
        required: true,
        placeholder: 'Your answer...',
    },
    // Section 8: Qualitative Insight
    {
        id: 'improvement_suggestions',
        section: 'Qualitative Insight',
        text: 'Is there anything that could have made this masterclass more useful for you?',
        type: 'text' as const,
        required: true,
        placeholder: 'Your answer...',
    },
]

// =============================================
// MANAGEMENT QUESTIONS (from Post-Masterclass Impact Survey — Top Management)
// =============================================
const managementQuestions = [
    // Section 1: Overall Experience
    {
        id: 'overall_value',
        section: 'Overall Experience',
        text: 'Overall, how valuable was this masterclass for your studio?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not valuable at all', 'Extremely valuable'],
    },
    {
        id: 'content_relevance',
        section: 'Overall Experience',
        text: "How relevant was the masterclass content to your studio's strategic priorities?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not relevant', 'Extremely relevant'],
    },
    // Section 2: Confidence & Skill Shift (Leadership View)
    {
        id: 'team_confidence_now',
        section: 'Confidence & Skill Shift (Leadership View)',
        text: 'How confident do you now feel that your team can use AI tools effectively?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    {
        id: 'team_skill_estimate',
        section: 'Confidence & Skill Shift (Leadership View)',
        text: "How would you rate your team's overall AI skill level after the masterclass?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Beginner', 'Advanced'],
    },
    {
        id: 'team_confidence_change',
        section: 'Confidence & Skill Shift (Leadership View)',
        text: 'Compared to before the masterclass, how has team capability changed?',
        type: 'radio' as const,
        required: true,
        options: ['Significantly decreased', 'Slightly decreased', 'No change', 'Slightly increased', 'Significantly increased'],
    },
    // Section 3: Workflow & Operational Impact
    {
        id: 'workflow_impact',
        section: 'Workflow & Operational Impact',
        text: 'To what extent has the masterclass improved the following areas across the studio?',
        type: 'matrix' as const,
        required: true,
        matrixItems: [
            'Design iteration speed',
            'Concept clarity and storytelling',
            'Visual consistency and control',
            'Handling of client revisions',
            'Translation of ideas into buildable design',
        ],
        scaleLabels: ['No improvement', 'Significant improvement'],
    },
    // Section 4: Quality, Brand & Risk Management
    {
        id: 'quality_confidence',
        section: 'Quality, Brand & Risk Management',
        text: "How confident are you now that AI outputs can meet your studio's quality and brand standards?",
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not confident', 'Very confident'],
    },
    {
        id: 'control_change',
        section: 'Quality, Brand & Risk Management',
        text: 'Compared to before the masterclass, how much control do you believe the studio now has over AI-generated outputs?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Much less control', 'Much more control'],
    },
    {
        id: 'remaining_concerns',
        section: 'Quality, Brand & Risk Management',
        text: 'Which quality or brand concerns still remain, if any?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: [
            'Loss of design authorship',
            'Inconsistent quality',
            'Client perception of AI',
            'Brand or style misalignment',
            'Data or IP concerns',
            'No major remaining concerns',
        ],
    },
    // Section 5: Adoption Readiness (Leadership View)
    {
        id: 'team_readiness_now',
        section: 'Adoption Readiness (Leadership View)',
        text: 'How ready do you believe your teams are to apply the demonstrated AI workflows immediately?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not ready', 'Fully ready'],
    },
    {
        id: 'ai_context_likelihood',
        section: 'Adoption Readiness (Leadership View)',
        text: 'How likely are you to support AI use in the following contexts moving forward?',
        type: 'matrix' as const,
        required: true,
        matrixItems: ['Internal concept development', 'Client-facing visuals'],
        scaleLabels: ['Very unlikely', 'Very likely'],
    },
    // Section 6: Business & Strategic Impact
    {
        id: 'revision_cycle_impact',
        section: 'Business & Strategic Impact',
        text: 'What impact do you expect AI workflows to have on revision cycles?',
        type: 'radio' as const,
        required: true,
        options: ['No impact', 'Slight reduction', 'Moderate reduction', 'Significant reduction'],
    },
    {
        id: 'collaboration_impact',
        section: 'Business & Strategic Impact',
        text: 'What impact do you expect AI workflows to have on team collaboration?',
        type: 'radio' as const,
        required: true,
        options: ['No impact', 'Slight improvement', 'Moderate improvement', 'Significant improvement'],
    },
    {
        id: 'competitive_advantage',
        section: 'Business & Strategic Impact',
        text: 'To what extent do you believe AI adoption will provide your studio with a competitive advantage?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['No advantage', 'Significant advantage'],
    },
    // Section 7: Success Validation
    {
        id: 'goals_achieved',
        section: 'Success Validation',
        text: 'From a leadership perspective, were your initial goals for this masterclass achieved?',
        type: 'radio' as const,
        required: true,
        options: ['Yes', 'Partially', 'No'],
    },
    {
        id: 'outcomes_achieved',
        section: 'Success Validation',
        text: 'Which of the following outcomes were achieved as a result of the masterclass?',
        type: 'checkbox' as const,
        required: true,
        maxSelections: 2,
        options: [
            'Faster concept generation',
            'Higher-quality visual output',
            'More controlled AI results',
            'Reduced revision cycles',
            'Clear AI workflows for the studio',
            'Team upskilling',
        ],
    },
    // Section 8: Net Outcome & Recommendation
    {
        id: 'overall_success',
        section: 'Net Outcome & Recommendation',
        text: 'Overall, how successful was this masterclass for your studio?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Not successful', 'Extremely successful'],
    },
    {
        id: 'recommend_likelihood',
        section: 'Net Outcome & Recommendation',
        text: 'How likely are you to recommend this masterclass to another studio or leadership team?',
        type: 'scale' as const,
        required: true,
        scaleLabels: ['Very unlikely', 'Very likely'],
    },
    {
        id: 'most_valuable',
        section: 'Net Outcome & Recommendation',
        text: 'In one sentence, what was the most valuable outcome of this masterclass from a leadership perspective?',
        type: 'text' as const,
        required: true,
        placeholder: 'Your answer...',
    },
]

type SurveyType = 'team' | 'management'

export function PostCompletionSurvey() {
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
                .from('post_completion_survey_responses')
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
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
                <div className="w-full max-w-lg text-center">
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
                        className="hero-text text-2xl mb-4"
                    >
                        Thank you!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="text-gray-400 text-lg mb-6"
                    >
                        Your response has been recorded. We appreciate you taking the time to share your experience.
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
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-sm mb-6">
                            <Sparkles className="h-4 w-4" />
                            Zkandar AI
                        </div>
                        <h1 className="hero-text text-3xl mb-4">Post-Masterclass Impact Survey</h1>
                        <p className="text-gray-400 text-lg">
                            Help us understand how the masterclass impacted your skills, confidence, and workflow.
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
                            <p className="text-gray-400 text-sm">Designer, Architect, Visualizer, or Technical staff who participated in the masterclass</p>
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
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-xl"
                >
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Step 2 of {totalSteps}</span>
                            <span>{Math.round((2 / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(2 / totalSteps) * 100}%` }}
                                className="h-full gradient-lime"
                            />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-6">Your Details</h2>
                    <p className="text-gray-400 text-sm mb-6">Your responses are confidential and used only to improve future sessions.</p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={basicInfo.full_name}
                                onChange={e => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email *</label>
                            <input
                                type="email"
                                value={basicInfo.email}
                                onChange={e => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium mb-2">Company / Studio Name *</label>
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
                                className={`w-full px-4 py-3 bg-bg-card border rounded-xl focus:outline-none transition-colors ${companyId ? 'border-lime/60' : 'border-border focus:border-lime/50'
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
                                                <span>{company.name}</span>
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
                            className="flex-1 py-3 border border-border rounded-xl hover:border-lime/50 transition-colors flex items-center justify-center gap-2"
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-2xl"
                >
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-bg-card rounded-full overflow-hidden">
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
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: n }))}
                                            className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${answers[currentQuestion.id] === n ? 'border-lime bg-lime/10 text-lime' : 'border-border bg-bg-card hover:border-lime/50'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Text */}
                        {currentQuestion?.type === 'text' && (
                            <textarea
                                value={(answers[currentQuestion.id] as string) || ''}
                                onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                placeholder={currentQuestion.placeholder}
                                rows={4}
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-colors resize-none"
                            />
                        )}

                        {/* Matrix */}
                        {currentQuestion?.type === 'matrix' && (
                            <div className="space-y-4">
                                {currentQuestion.matrixItems?.map(item => {
                                    const matrixAnswers = (answers[currentQuestion.id] as Record<string, number>) || {}
                                    return (
                                        <div key={item} className="p-4 bg-bg-card rounded-xl border border-border">
                                            <p className="text-sm font-medium mb-3">{item}</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setAnswers(prev => ({
                                                            ...prev,
                                                            [currentQuestion.id]: { ...matrixAnswers, [item]: n }
                                                        }))}
                                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${matrixAnswers[item] === n ? 'border-lime bg-lime/10 text-lime' : 'border-border hover:border-lime/50'}`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>{currentQuestion.scaleLabels?.[0]}</span>
                                    <span>{currentQuestion.scaleLabels?.[1]}</span>
                                </div>
                            </div>
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
                                disabled={isSubmitting || !canProceed()}
                                className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                                <Sparkles className="h-5 w-5" />
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
