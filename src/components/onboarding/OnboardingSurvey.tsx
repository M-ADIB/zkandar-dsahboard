import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, ChevronDown, Sparkles, CheckCircle2, Users, Briefcase, Search, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { UserType } from '@/types/database'
import { onboardingBasicInfoSchema } from '@/lib/validation'

interface OnboardingSurveyProps {
    isSprintWorkshop?: boolean
}
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

export function OnboardingSurvey({ isSprintWorkshop = false }: OnboardingSurveyProps = {}) {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()

    // State
    const [step, setStep] = useState(isSprintWorkshop ? 1 : 0) // 0 = role selection, 1 = basic info, 2+ = questions
    const [userType, setUserType] = useState<UserType | null>(isSprintWorkshop ? 'team' : null)
    const [showPasswordChange, setShowPasswordChange] = useState(!user?.profile_data?.password_changed)
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    })
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [showPasswords, setShowPasswords] = useState(false)
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
    const [companiesLoading, setCompaniesLoading] = useState(true)
    const [companiesError, setCompaniesError] = useState<string | null>(null)
    const [companySearch, setCompanySearch] = useState('')
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

    // Get questions based on user type
    const baseQuestions = userType === 'management' ? managementQuestions : teamQuestions
    const questions = baseQuestions.map(q => {
        if (!isSprintWorkshop) return q as typeof baseQuestions[number]
        return {
            ...q,
            section: q.section.replace(/masterclass/gi, 'sprint workshop'),
            text: q.text.replace(/masterclass/gi, 'sprint workshop'),
            placeholder: q.placeholder ? q.placeholder.replace(/masterclass/gi, 'sprint workshop') : undefined
        } as typeof baseQuestions[number]
    })
    const totalSteps = (isSprintWorkshop ? 1 : 2) + questions.length // role selection (skipped if sprint) + basic info + questions

    // Fetch companies on mount
    useEffect(() => {
        async function fetchCompanies() {
            setCompaniesLoading(true)
            setCompaniesError(null)
            const { data, error } = await supabase
                .from('companies')
                .select('id, name')
                .order('name')
            if (error) {
                setCompaniesError(error.message)
                setCompanies([])
            } else if (data) {
                setCompanies(data)
            }
            setCompaniesLoading(false)
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

        const activeSchema = isSprintWorkshop
            ? onboardingBasicInfoSchema.omit({ company_id: true })
            : onboardingBasicInfoSchema

        const validation = activeSchema.safeParse(basicInfo)
        if (!validation.success) {
            toast.error(validation.error.errors[0]?.message || 'Please check your basic information.')
            return
        }

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
                        basic_info: validation.data,
                        survey_answers: answers,
                        completed_at: new Date().toISOString(),
                    },
                } as any)
                .eq('id', user.id)

            if (error) {
                console.error('Onboarding update error:', error)
                throw error
            }

            await refreshUser()
            toast.success(`Welcome to Zkandar AI ${isSprintWorkshop ? 'Sprint Workshop' : 'Master Class'}!`)
            navigate('/dashboard')
        } catch (error) {
            console.error('Error submitting survey:', error)
            const message = error instanceof Error ? error.message : 'Failed to submit survey.'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        console.info('[Onboarding] Password update started')
        
        if (!user) {
            console.error('[Onboarding] User session not found during password update')
            toast.error('User session not found')
            return
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setIsUpdatingPassword(true)
        try {
            console.info('[Onboarding] Calling supabase.auth.updateUser...')
            const { error: authError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (authError) {
                console.error('[Onboarding] Auth update failed:', authError)
                throw authError
            }
            console.info('[Onboarding] Auth update successful')

            // Update public.users profile_data to track that password was changed
            console.info('[Onboarding] Updating public.users profile_data...')
            const { error: dbError } = await (supabase
                .from('users')
                .update({
                    profile_data: {
                        ...(user.profile_data as Record<string, any> || {}),
                        password_changed: true,
                        password_changed_at: new Date().toISOString()
                    }
                } as any) as any)
                .eq('id', user.id)

            if (dbError) {
                console.error('[Onboarding] DB update failed:', dbError)
                throw dbError
            }
            console.info('[Onboarding] DB update successful')

            toast.success('Password updated successfully')
            setShowPasswordChange(false)
            
            console.info('[Onboarding] Refreshing user profile...')
            await refreshUser()
            console.info('[Onboarding] User profile refreshed')
        } catch (error) {
            console.error('[Onboarding] Error updating password:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update password')
        } finally {
            console.info('[Onboarding] Password update sequence finished')
            setIsUpdatingPassword(false)
        }
    }

    const activeSchema = isSprintWorkshop
        ? onboardingBasicInfoSchema.omit({ company_id: true })
        : onboardingBasicInfoSchema

    const basicInfoValidation = activeSchema.safeParse(basicInfo)
    const companySelectionError = (!isSprintWorkshop && !basicInfo.company_id)
        ? (companySearch.trim().length === 0
            ? 'Select your company from the list to continue.'
            : filteredCompanies.length === 0
                ? 'No matching company found. Ask an admin to add your company.'
                : 'Select your company from the list to continue.')
        : null

    const basicInfoError = step === 1
        ? companySelectionError || (basicInfoValidation.success ? null : basicInfoValidation.error.errors[0]?.message)
        : null

    const canProceed = () => {
        if (step === 0) return userType !== null
        if (step === 1) {
            return basicInfoValidation.success
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

    // Survey Question Helpers
    const questionIndex = step >= 2 ? step - 2 : -1
    const currentQuestion = step >= 2 ? questions[questionIndex] : null
    const currentSection = currentQuestion?.section
    const sections = [...new Set(questions.map(q => q.section))]
    const currentSectionIndex = currentSection ? sections.indexOf(currentSection) : -1

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {showPasswordChange ? (
                    <motion.div
                        key="password-change"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <div className="w-full max-w-md bg-bg-card border border-border rounded-[24px] p-8 shadow-2xl relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles className="h-24 w-24 text-lime" />
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-lime" />
                                Secure Your Account
                            </h2>
                            <p className="text-gray-400 text-sm mb-8">
                                Please update your temporary password before proceeding to the {isSprintWorkshop ? 'Sprint Workshop' : 'Master Class'} onboarding.
                            </p>

                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            required
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/[0.03] border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-all font-mono pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    
                                    {/* Password Criteria */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-lime' : 'bg-gray-600'}`} />
                                            <p className={`text-[10px] uppercase font-bold tracking-wider ${passwordData.newPassword.length >= 8 ? 'text-lime' : 'text-gray-500'}`}>
                                                At least 8 characters
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            required
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/[0.03] border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-all font-mono pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {/* Match Criteria */}
                                    <div className="mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword ? 'bg-lime' : 'bg-gray-600'}`} />
                                            <p className={`text-[10px] uppercase font-bold tracking-wider ${passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword ? 'text-lime' : 'text-gray-500'}`}>
                                                Passwords match
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="w-full py-4 gradient-lime text-black font-black uppercase tracking-widest text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isUpdatingPassword ? 'Updating...' : 'Set New Password'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`step-${step}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className={step >= 2 ? "w-full max-w-2xl px-4 text-white" : "w-full max-w-xl px-4 text-white"}
                    >
                        {/* 0. ROLE SELECTION */}
                        {step === 0 && (
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-sm mb-6">
                                    <Sparkles className="h-4 w-4" />
                                    Zkandar AI {isSprintWorkshop ? "Sprint Workshop" : "Master Class"}
                                </div>
                                <h1 className="hero-text text-4xl mb-4 text-white">Welcome to Zkandar AI</h1>
                                <p className="text-gray-400 text-lg mb-12">
                                    Before we get started, are you team or management?
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setUserType('team')}
                                        className={`p-8 rounded-[24px] border-2 transition-all text-left ${userType === 'team'
                                            ? 'border-lime bg-lime/10'
                                            : 'border-border bg-bg-card hover:border-lime/50'
                                            }`}
                                    >
                                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${userType === 'team' ? 'gradient-lime' : 'bg-white/5'
                                            }`}>
                                            <Users className={`h-7 w-7 ${userType === 'team' ? 'text-black' : 'text-gray-400'}`} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Team Member</h3>
                                        <p className="text-gray-400 text-sm">
                                            Designer, Architect, Visualizer, or Technical staff learning AI tools
                                        </p>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setUserType('management')}
                                        className={`p-8 rounded-[24px] border-2 transition-all text-left ${userType === 'management'
                                            ? 'border-lime bg-lime/10'
                                            : 'border-border bg-bg-card hover:border-lime/50'
                                            }`}
                                    >
                                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${userType === 'management' ? 'gradient-lime' : 'bg-white/5'
                                            }`}>
                                            <Briefcase className={`h-7 w-7 ${userType === 'management' ? 'text-black' : 'text-gray-400'}`} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Management</h3>
                                        <p className="text-gray-400 text-sm">
                                            Director, Partner, Studio Lead, or other senior leadership role
                                        </p>
                                    </motion.button>
                                </div>

                                <motion.button
                                    onClick={handleNext}
                                    disabled={!userType}
                                    className="w-full mt-12 py-4 gradient-lime text-black font-black uppercase tracking-widest rounded-xl
                                        hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed
                                        flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ChevronRight className="h-5 w-5" />
                                </motion.button>
                            </div>
                        )}

                        {/* 1. BASIC INFO */}
                        {step === 1 && (
                            <div className="bg-bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <div className="mb-8">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">
                                        <span>Step {isSprintWorkshop ? 1 : 2} of {totalSteps}</span>
                                        <span>{Math.round(((isSprintWorkshop ? 1 : 2) / totalSteps) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((isSprintWorkshop ? 1 : 2) / totalSteps) * 100}%` }}
                                            className="h-full gradient-lime shadow-[0_0_10px_rgba(208,255,113,0.5)]"
                                        />
                                    </div>
                                </div>

                                <h2 className="text-3xl font-bold mb-8">Personal Details</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={basicInfo.full_name}
                                            onChange={(e) => setBasicInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="Your full name"
                                            className="w-full px-4 py-4 bg-white/[0.03] border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-all shadow-inner text-white"
                                        />
                                    </div>

                                    {!isSprintWorkshop && (
                                        <div className="relative">
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Company</label>
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
                                                    placeholder="Search company..."
                                                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-all shadow-inner text-white"
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {showCompanyDropdown && filteredCompanies.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-10 w-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl"
                                                    >
                                                        {filteredCompanies.map(company => (
                                                            <button
                                                                key={company.id}
                                                                onClick={() => {
                                                                    setBasicInfo(prev => ({ ...prev, company_id: company.id }))
                                                                    setCompanySearch('')
                                                                    setShowCompanyDropdown(false)
                                                                }}
                                                                className="w-full px-4 py-4 text-left hover:bg-lime/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                                                            >
                                                                <span className="flex-1 text-white">{company.name}</span>
                                                                {basicInfo.company_id === company.id && (
                                                                    <CheckCircle2 className="h-5 w-5 text-lime" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Age</label>
                                            <input
                                                type="number"
                                                value={basicInfo.age}
                                                onChange={(e) => setBasicInfo(prev => ({ ...prev, age: e.target.value }))}
                                                placeholder="25"
                                                className="w-full px-4 py-4 bg-white/[0.03] border border-border rounded-xl focus:outline-none focus:border-lime/50 transition-all shadow-inner text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Nationality</label>
                                            <div className="relative">
                                                <select
                                                    value={basicInfo.nationality}
                                                    onChange={(e) => setBasicInfo(prev => ({ ...prev, nationality: e.target.value }))}
                                                    className="w-full px-4 py-4 pr-12 bg-white/[0.03] border border-border rounded-xl appearance-none focus:outline-none focus:border-lime/50 transition-all shadow-inner text-white"
                                                >
                                                    <option value="" disabled className="bg-bg-primary">Select</option>
                                                    {nationalities.map(n => (
                                                        <option key={n} value={n} className="bg-bg-primary">{n}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {companiesLoading && (
                                    <div className="mt-4 p-4 bg-white/5 rounded-xl text-sm text-gray-400 flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                                        Loading companies...
                                    </div>
                                )}

                                {companiesError && (
                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                        {companiesError}
                                    </div>
                                )}

                                {basicInfoError && (
                                    <div className="mt-8 p-4 bg-lime/5 border border-lime/20 rounded-xl text-sm text-lime flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-lime animate-pulse" />
                                        {basicInfoError}
                                    </div>
                                )}

                                <div className="flex gap-4 mt-12">
                                    {(step > 0 && !isSprintWorkshop) && (
                                        <button
                                            onClick={handleBack}
                                            className="px-8 py-4 border border-border rounded-xl hover:border-lime/50 transition-all flex items-center justify-center"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                        className="flex-1 py-4 gradient-lime text-black font-black uppercase tracking-widest text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Continue
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 2+. SURVEY QUESTIONS */}
                        {step >= 2 && currentQuestion && (
                            <div className="bg-bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                {/* Ambient Sparkle */}
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Sparkles className="h-24 w-24 text-lime" />
                                </div>

                                {/* Progress */}
                                <div className="mb-12">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">
                                        <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                                        <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                                            className="h-full gradient-lime shadow-[0_0_10px_rgba(208,255,113,0.5)]"
                                        />
                                    </div>
                                    <p className="text-lime text-[11px] uppercase tracking-[0.2em] font-black mt-4">{currentSection}</p>
                                </div>

                                <h2 className="text-2xl font-bold mb-8 leading-tight text-white">
                                    {currentQuestion.text}
                                    {currentQuestion.required && <span className="text-lime ml-2">*</span>}
                                </h2>

                                {currentQuestion.maxSelections && (
                                    <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-lime/50" />
                                        Select up to {currentQuestion.maxSelections}
                                    </p>
                                )}

                                <div className="space-y-4">
                                    {/* RADIO */}
                                    {currentQuestion.type === 'radio' && currentQuestion.options?.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion!.id]: option }))}
                                            className={`w-full p-5 rounded-[20px] border-2 text-left transition-all relative overflow-hidden group ${answers[currentQuestion!.id] === option
                                                ? 'border-lime bg-lime/10 shadow-[0_0_20px_rgba(208,255,113,0.1)]'
                                                : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${answers[currentQuestion!.id] === option ? 'border-lime bg-lime' : 'border-white/20'}`}>
                                                    {answers[currentQuestion!.id] === option && <div className="h-2 w-2 rounded-full bg-black" />}
                                                </div>
                                                <span className={`text-lg transition-colors ${answers[currentQuestion!.id] === option ? 'text-white' : 'text-gray-400'}`}>
                                                    {option}
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                    {/* CHECKBOX */}
                                    {currentQuestion.type === 'checkbox' && currentQuestion.options?.map(option => {
                                        const currentAnswers = (answers[currentQuestion!.id] as string[]) || []
                                        const isSelected = currentAnswers.includes(option)
                                        const maxReached = !!(currentQuestion!.maxSelections && currentAnswers.length >= currentQuestion!.maxSelections)

                                        return (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setAnswers(prev => ({
                                                            ...prev,
                                                            [currentQuestion!.id]: currentAnswers.filter(a => a !== option)
                                                        }))
                                                    } else if (!maxReached) {
                                                        setAnswers(prev => ({
                                                            ...prev,
                                                            [currentQuestion!.id]: [...currentAnswers, option]
                                                        }))
                                                    }
                                                }}
                                                disabled={!isSelected && maxReached}
                                                className={`w-full p-5 rounded-[20px] border-2 text-left transition-all ${isSelected
                                                    ? 'border-lime bg-lime/10 shadow-[0_0_20px_rgba(208,255,113,0.1)]'
                                                    : maxReached
                                                        ? 'border-white/5 bg-white/[0.01] opacity-30 cursor-not-allowed'
                                                        : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'border-lime bg-lime' : 'border-white/20'}`}>
                                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-black" />}
                                                    </div>
                                                    <span className={`text-lg transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                        {option}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}

                                    {/* SCALE */}
                                    {currentQuestion.type === 'scale' && (
                                        <div className="py-6">
                                            <div className="flex justify-between text-xs uppercase tracking-widest font-black text-lime/50 mb-6 px-2">
                                                <span>{currentQuestion.scaleLabels?.[0]}</span>
                                                <span>{currentQuestion.scaleLabels?.[1]}</span>
                                            </div>
                                            <div className="flex gap-3">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion!.id]: n }))}
                                                        className={`flex-1 py-6 rounded-[20px] border-2 font-black text-xl transition-all ${answers[currentQuestion!.id] === n
                                                            ? 'border-lime bg-lime/10 text-lime shadow-[0_0_30px_rgba(208,255,113,0.2)]'
                                                            : 'border-white/5 bg-white/[0.02] hover:border-white/20 text-gray-500'
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TEXT */}
                                    {currentQuestion.type === 'text' && (
                                        <textarea
                                            value={(answers[currentQuestion.id] as string) || ''}
                                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion!.id]: e.target.value }))}
                                            placeholder={currentQuestion.placeholder}
                                            rows={6}
                                            className="w-full p-6 bg-white/[0.02] border-2 border-white/5 rounded-[24px] focus:outline-none focus:border-lime/50 transition-all resize-none text-lg text-white"
                                        />
                                    )}

                                    {/* MATRIX */}
                                    {currentQuestion.type === 'matrix' && (
                                        <div className="space-y-6">
                                            {currentQuestion.matrixItems?.map(item => {
                                                const matrixAnswers = (answers[currentQuestion!.id] as Record<string, number>) || {}
                                                return (
                                                    <div key={item} className="p-6 bg-white/[0.02] rounded-[24px] border border-white/5">
                                                        <p className="text-sm font-bold mb-6 text-gray-300 uppercase tracking-widest">{item}</p>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <button
                                                                    key={n}
                                                                    onClick={() => setAnswers(prev => ({
                                                                        ...prev,
                                                                        [currentQuestion!.id]: { ...matrixAnswers, [item]: n }
                                                                    }))}
                                                                    className={`flex-1 py-4 rounded-xl border-2 text-sm font-black transition-all ${matrixAnswers[item] === n
                                                                        ? 'border-lime bg-lime/10 text-lime'
                                                                        : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-500'
                                                                        }`}
                                                                >
                                                                    {n}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div className="flex justify-between text-[11px] uppercase tracking-widest font-black text-lime/30 px-2">
                                                <span>{currentQuestion.scaleLabels?.[0]}</span>
                                                <span>{currentQuestion.scaleLabels?.[1]}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex gap-4 mt-12">
                                    <button
                                        onClick={handleBack}
                                        className="px-8 py-4 border border-border rounded-xl hover:border-lime/50 transition-all flex items-center justify-center group"
                                    >
                                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                    {isLastStep ? (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !canProceed()}
                                            className="flex-1 py-4 gradient-lime text-black font-black uppercase tracking-widest text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(208,255,113,0.3)]"
                                        >
                                            {isSubmitting ? 'Completing...' : 'Complete Masterclass Hub Onboarding'}
                                            <Sparkles className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="flex-1 py-4 gradient-lime text-black font-black uppercase tracking-widest text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Next Question
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
