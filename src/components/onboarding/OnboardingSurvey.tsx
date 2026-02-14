import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Users, Briefcase, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { UserType } from '@/types/database'
import { onboardingBasicInfoSchema } from '@/lib/validation'

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

// =============================================
// NATIONALITIES LIST
// =============================================
const nationalities = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian', 'Austrian',
    'Azerbaijani', 'Bahraini', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Cambodian', 'Cameroonian', 'Canadian',
    'Chilean', 'Chinese', 'Colombian', 'Croatian', 'Cuban', 'Czech', 'Danish', 'Dutch', 'Ecuadorian', 'Egyptian',
    'Emirati', 'Ethiopian', 'Filipino', 'Finnish', 'French', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Hungarian',
    'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian',
    'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Libyan', 'Lithuanian', 'Malaysian', 'Maltese', 'Mexican',
    'Moroccan', 'Nepalese', 'New Zealander', 'Nigerian', 'Norwegian', 'Omani', 'Pakistani', 'Palestinian', 'Panamanian', 'Peruvian',
    'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Senegalese', 'Serbian', 'Singaporean', 'South African',
    'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Thai', 'Tunisian', 'Turkish',
    'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
]

interface Company {
    id: string
    name: string
}

export function OnboardingSurvey() {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()

    // State
    const [step, setStep] = useState(0) // 0 = role selection, 1 = basic info, 2+ = questions
    const [userType, setUserType] = useState<UserType | null>(null)
    const [basicInfo, setBasicInfo] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        company_id: user?.company_id || '',
        age: '',
        nationality: '',
    })
    const [answers, setAnswers] = useState<Record<string, string | string[] | number | Record<string, number>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])
    const [companySearch, setCompanySearch] = useState('')
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

    // Get questions based on user type
    const questions = userType === 'management' ? managementQuestions : teamQuestions
    const totalSteps = 2 + questions.length // role selection + basic info + questions

    // Fetch companies on mount
    useEffect(() => {
        async function fetchCompanies() {
            const { data } = await supabase.from('companies').select('id, name').order('name')
            if (data) setCompanies(data)
        }
        fetchCompanies()
    }, [])

    // Filter companies based on search
    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(companySearch.toLowerCase())
    )

    const selectedCompany = companies.find(c => c.id === basicInfo.company_id)

    const handleNext = () => {
        setStep(prev => Math.min(prev + 1, totalSteps - 1))
    }

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 0))
    }

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)

        try {
            // Calculate AI readiness score (simplified)
            const scaleAnswers = Object.entries(answers).filter(([key]) =>
                questions.find(q => q.id === key && q.type === 'scale')
            )
            const avgScore = scaleAnswers.length > 0
                ? scaleAnswers.reduce((sum, [, val]) => sum + (typeof val === 'number' ? val : 0), 0) / scaleAnswers.length * 20
                : 50

            // Update user profile
            const { error } = await supabase
                .from('users')
                // @ts-expect-error - Supabase update type inference failing
                .update({
                    full_name: basicInfo.full_name,
                    company_id: basicInfo.company_id || null,
                    user_type: userType,
                    onboarding_completed: true,
                    ai_readiness_score: Math.round(avgScore),
                    onboarding_data: {
                        basic_info: onboardingBasicInfoSchema.parse(basicInfo),
                        survey_answers: answers,
                        completed_at: new Date().toISOString(),
                    },
                } as any)
                .eq('id', user.id)

            if (error) throw error

            await refreshUser()
            toast.success('Welcome to Zkandar AI Masterclass!')
            navigate('/dashboard')
        } catch (error) {
            console.error('Error submitting survey:', error)
            toast.error('Failed to submit survey. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const canProceed = () => {
        if (step === 0) return userType !== null
        if (step === 1) {
            return onboardingBasicInfoSchema.safeParse(basicInfo).success
        }
        // Check current question
        const questionIndex = step - 2
        if (questionIndex >= 0 && questionIndex < questions.length) {
            const q = questions[questionIndex]
            if (!q.required) return true
            const answer = answers[q.id]
            if (!answer) return false
            if (Array.isArray(answer) && answer.length === 0) return false
            if (q.type === 'matrix') {
                const matrixAnswer = answer as Record<string, number>
                return Object.keys(matrixAnswer).length === q.matrixItems?.length
            }
        }
        return true
    }

    const isLastStep = step === totalSteps - 1

    // =============================================
    // RENDER: Step 0 - Role Selection
    // =============================================
    if (step === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-sm mb-6">
                            <Sparkles className="h-4 w-4" />
                            Zkandar AI Masterclass
                        </div>
                        <h1 className="hero-text text-4xl mb-4">Welcome!</h1>
                        <p className="text-gray-400 text-lg">
                            Let's personalize your learning experience. Are you joining as...
                        </p>
                    </div>

                    {/* Role Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Team Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setUserType('team')}
                            className={`p-8 rounded-2xl border-2 transition-all text-left ${userType === 'team'
                                ? 'border-lime bg-lime/10'
                                : 'border-border bg-bg-card hover:border-lime/50'
                                }`}
                        >
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${userType === 'team' ? 'gradient-lime' : 'bg-bg-elevated'
                                }`}>
                                <Users className={`h-7 w-7 ${userType === 'team' ? 'text-black' : 'text-gray-400'}`} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Team Member</h3>
                            <p className="text-gray-400 text-sm">
                                Designer, Architect, Visualizer, or Technical staff learning AI tools
                            </p>
                        </motion.button>

                        {/* Management Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setUserType('management')}
                            className={`p-8 rounded-2xl border-2 transition-all text-left ${userType === 'management'
                                ? 'border-lime bg-lime/10'
                                : 'border-border bg-bg-card hover:border-lime/50'
                                }`}
                        >
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${userType === 'management' ? 'gradient-lime' : 'bg-bg-elevated'
                                }`}>
                                <Briefcase className={`h-7 w-7 ${userType === 'management' ? 'text-black' : 'text-gray-400'}`} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Management</h3>
                            <p className="text-gray-400 text-sm">
                                Director, Partner, Studio Lead, or other senior leadership role
                            </p>
                        </motion.button>
                    </div>

                    {/* Continue Button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: userType ? 1 : 0.5 }}
                        onClick={handleNext}
                        disabled={!userType}
                        className="w-full mt-8 py-4 gradient-lime text-black font-bold rounded-xl
                            hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2"
                    >
                        Continue
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                </motion.div>
            </div>
        )
    }

    // =============================================
    // RENDER: Step 1 - Basic Info
    // =============================================
    if (step === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-xl"
                >
                    {/* Progress */}
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

                    <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

                    <div className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={basicInfo.full_name}
                                onChange={(e) => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl
                                    focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email *</label>
                            <input
                                type="email"
                                value={basicInfo.email}
                                onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl
                                    focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        </div>

                        {/* Company */}
                        <div className="relative">
                            <label className="block text-sm font-medium mb-2">Company Name *</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={selectedCompany?.name || companySearch}
                                    onChange={(e) => {
                                        setCompanySearch(e.target.value)
                                        setBasicInfo(prev => ({ ...prev, company_id: '' }))
                                        setShowCompanyDropdown(true)
                                    }}
                                    onFocus={() => setShowCompanyDropdown(true)}
                                    placeholder="Start typing your company name..."
                                    className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border rounded-xl
                                        focus:outline-none focus:border-lime/50 transition-colors"
                                />
                            </div>
                            <AnimatePresence>
                                {showCompanyDropdown && filteredCompanies.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 w-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                    >
                                        {filteredCompanies.map(company => (
                                            <button
                                                key={company.id}
                                                onClick={() => {
                                                    setBasicInfo(prev => ({ ...prev, company_id: company.id }))
                                                    setCompanySearch('')
                                                    setShowCompanyDropdown(false)
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-lime/10 transition-colors flex items-center gap-2"
                                            >
                                                {company.name}
                                                {basicInfo.company_id === company.id && (
                                                    <CheckCircle2 className="h-4 w-4 text-lime ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Age *</label>
                            <input
                                type="number"
                                value={basicInfo.age}
                                onChange={(e) => setBasicInfo(prev => ({ ...prev, age: e.target.value }))}
                                placeholder="Your age"
                                min="18"
                                max="100"
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl
                                    focus:outline-none focus:border-lime/50 transition-colors"
                            />
                        </div>

                        {/* Nationality */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Nationality *</label>
                            <select
                                value={basicInfo.nationality}
                                onChange={(e) => setBasicInfo(prev => ({ ...prev, nationality: e.target.value }))}
                                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl
                                    focus:outline-none focus:border-lime/50 transition-colors"
                            >
                                <option value="">Select your nationality</option>
                                {nationalities.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 border border-border rounded-xl hover:border-lime/50
                                transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl
                                hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
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
    // RENDER: Steps 2+ - Survey Questions
    // =============================================
    const questionIndex = step - 2
    const currentQuestion = questions[questionIndex]
    const currentSection = currentQuestion?.section

    // Get unique sections for progress
    const sections = [...new Set(questions.map(q => q.section))]
    const currentSectionIndex = sections.indexOf(currentSection || '')

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
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
                    <p className="text-lime text-sm mt-2">{currentSection}</p>
                </div>

                {/* Question */}
                <h2 className="text-xl font-bold mb-6">
                    {currentQuestion.text}
                    {currentQuestion.required && <span className="text-red-400 ml-1">*</span>}
                </h2>
                {currentQuestion.maxSelections && (
                    <p className="text-gray-500 text-sm mb-4">Select up to {currentQuestion.maxSelections}</p>
                )}

                {/* Answer Input based on type */}
                <div className="space-y-3">
                    {currentQuestion.type === 'radio' && currentQuestion.options?.map(option => (
                        <button
                            key={option}
                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${answers[currentQuestion.id] === option
                                ? 'border-lime bg-lime/10'
                                : 'border-border bg-bg-card hover:border-lime/50'
                                }`}
                        >
                            {option}
                        </button>
                    ))}

                    {currentQuestion.type === 'checkbox' && currentQuestion.options?.map(option => {
                        const currentAnswers = (answers[currentQuestion.id] as string[]) || []
                        const isSelected = currentAnswers.includes(option)
                        // Coerce to boolean to avoid type errors
                        const maxReached = !!(currentQuestion.maxSelections && currentAnswers.length >= currentQuestion.maxSelections)

                        return (
                            <button
                                key={option}
                                onClick={() => {
                                    if (isSelected) {
                                        setAnswers(prev => ({
                                            ...prev,
                                            [currentQuestion.id]: currentAnswers.filter(a => a !== option)
                                        }))
                                    } else if (!maxReached) {
                                        setAnswers(prev => ({
                                            ...prev,
                                            [currentQuestion.id]: [...currentAnswers, option]
                                        }))
                                    }
                                }}
                                disabled={!isSelected && maxReached}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-lime bg-lime/10'
                                    : maxReached
                                        ? 'border-border bg-bg-card opacity-50 cursor-not-allowed'
                                        : 'border-border bg-bg-card hover:border-lime/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-lime bg-lime' : 'border-gray-500'
                                        }`}>
                                        {isSelected && <CheckCircle2 className="h-3 w-3 text-black" />}
                                    </div>
                                    {option}
                                </div>
                            </button>
                        )
                    })}

                    {currentQuestion.type === 'scale' && (
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
                                        className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${answers[currentQuestion.id] === n
                                            ? 'border-lime bg-lime/10 text-lime'
                                            : 'border-border bg-bg-card hover:border-lime/50'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentQuestion.type === 'text' && (
                        <textarea
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                            placeholder={currentQuestion.placeholder}
                            rows={4}
                            className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl
                                focus:outline-none focus:border-lime/50 transition-colors resize-none"
                        />
                    )}

                    {currentQuestion.type === 'matrix' && (
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
                                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${matrixAnswers[item] === n
                                                        ? 'border-lime bg-lime/10 text-lime'
                                                        : 'border-border hover:border-lime/50'
                                                        }`}
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
                        className="flex-1 py-3 border border-border rounded-xl hover:border-lime/50
                            transition-colors flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Back
                    </button>
                    {isLastStep ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canProceed()}
                            className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl
                                hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Submitting...' : 'Complete'}
                            <Sparkles className="h-5 w-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex-1 py-3 gradient-lime text-black font-bold rounded-xl
                                hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
                        >
                            Continue
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
