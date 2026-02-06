import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Question {
    id: string
    text: string
    type: 'radio' | 'scale' | 'text' | 'checkbox'
    options?: string[]
}

const questions: Question[] = [
    {
        id: 'experience',
        text: 'How would you describe your current experience with AI tools?',
        type: 'radio',
        options: ['Complete beginner', 'Dabbled a bit', 'Regular user', 'Advanced user'],
    },
    {
        id: 'tools',
        text: 'Which AI tools have you used before?',
        type: 'checkbox',
        options: ['ChatGPT', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'GitHub Copilot', 'None'],
    },
    {
        id: 'confidence',
        text: 'How confident are you in using AI for your architecture/design work?',
        type: 'scale',
    },
    {
        id: 'goals',
        text: 'What do you hope to achieve from this masterclass?',
        type: 'text',
    },
    {
        id: 'challenges',
        text: 'What is your biggest challenge when it comes to adopting AI in your workflow?',
        type: 'radio',
        options: ['Time to learn', 'Understanding prompts', 'Finding the right tools', 'Getting quality outputs', 'Integration with existing workflow'],
    },
]

export function OnboardingSurvey() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const currentQuestion = questions[currentStep]
    const progress = ((currentStep + 1) / questions.length) * 100

    const handleAnswer = (value: string | string[] | number) => {
        setAnswers({ ...answers, [currentQuestion.id]: value })
    }

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const calculateScore = () => {
        let score = 0

        // Experience
        const exp = answers.experience as string
        if (exp === 'Regular user') score += 20
        else if (exp === 'Advanced user') score += 30
        else if (exp === 'Dabbled a bit') score += 10

        // Tools
        const tools = answers.tools as string[] | undefined
        if (tools) score += Math.min(tools.length * 5, 25)

        // Confidence
        const confidence = answers.confidence as number | undefined
        if (confidence) score += confidence * 2

        // Goals (bonus for having goals)
        if (answers.goals) score += 15

        // Challenges awareness
        if (answers.challenges) score += 10

        return Math.min(score, 100)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const aiScore = calculateScore()

        try {
            // Update user profile
            const { error: userError } = await supabase
                .from('users')
                // @ts-expect-error - Supabase types not inferring correctly without generated types
                .update({
                    onboarding_completed: true,
                    ai_readiness_score: aiScore,
                    profile_data: { onboarding_answers: answers },
                })
                .eq('id', user?.id ?? '')

            if (userError) throw userError

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
        const answer = answers[currentQuestion.id]
        if (!answer) return false
        if (Array.isArray(answer) && answer.length === 0) return false
        if (typeof answer === 'string' && !answer.trim()) return false
        return true
    }

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl gradient-lime flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-black" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-heading font-bold mb-2">
                        Let's get to know you
                    </h1>
                    <p className="text-gray-400">
                        Help us personalize your learning experience
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                            Question {currentStep + 1} of {questions.length}
                        </span>
                        <span className="text-sm text-lime">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full gradient-lime"
                        />
                    </div>
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-bg-card border border-border rounded-2xl p-8"
                >
                    <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

                    {/* Radio Options */}
                    {currentQuestion.type === 'radio' && (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleAnswer(option)}
                                    className={`w-full text-left p-4 rounded-xl border transition ${answers[currentQuestion.id] === option
                                        ? 'border-lime bg-lime/10'
                                        : 'border-border hover:border-lime/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option
                                                ? 'border-lime'
                                                : 'border-gray-500'
                                                }`}
                                        >
                                            {answers[currentQuestion.id] === option && (
                                                <div className="h-2.5 w-2.5 rounded-full bg-lime" />
                                            )}
                                        </div>
                                        <span>{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Checkbox Options */}
                    {currentQuestion.type === 'checkbox' && (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option) => {
                                const selected = (answers[currentQuestion.id] as string[] || []).includes(option)
                                return (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            const current = (answers[currentQuestion.id] as string[] || [])
                                            if (selected) {
                                                handleAnswer(current.filter((o) => o !== option))
                                            } else {
                                                handleAnswer([...current, option])
                                            }
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border transition ${selected
                                            ? 'border-lime bg-lime/10'
                                            : 'border-border hover:border-lime/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-5 w-5 rounded border-2 flex items-center justify-center ${selected ? 'border-lime bg-lime' : 'border-gray-500'
                                                    }`}
                                            >
                                                {selected && <CheckCircle2 className="h-3 w-3 text-black" />}
                                            </div>
                                            <span>{option}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Scale */}
                    {currentQuestion.type === 'scale' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleAnswer(num)}
                                        className={`h-12 w-12 rounded-xl font-medium transition ${answers[currentQuestion.id] === num
                                            ? 'gradient-lime text-black'
                                            : 'bg-bg-elevated border border-border hover:border-lime/50'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Not confident</span>
                                <span>Very confident</span>
                            </div>
                        </div>
                    )}

                    {/* Text */}
                    {currentQuestion.type === 'text' && (
                        <textarea
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={4}
                            className="w-full p-4 bg-bg-elevated border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-lime/50"
                        />
                    )}
                </motion.div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition disabled:opacity-30"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </button>

                    {currentStep < questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-3 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || isSubmitting}
                            className="flex items-center gap-2 px-6 py-3 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Complete'}
                            <Sparkles className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
