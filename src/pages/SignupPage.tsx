import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Loader2, Building2, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import logo from '@/assets/logo.png'
import skenderImg from '@/assets/skender.png'

const signupSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    joinType: z.enum(['company', 'individual'], { required_error: 'Please select a join type' }),
    companyId: z.string().optional(),
    userType: z.enum(['management', 'team']).optional(),
    sprintCohortId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passwords don't match",
            path: ['confirmPassword'],
        })
    }
    if (data.joinType === 'company') {
        if (!data.companyId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a company", path: ['companyId'] })
        }
        if (!data.userType) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select your role", path: ['userType'] })
        }
    }
    if (data.joinType === 'individual' && !data.sprintCohortId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a workshop", path: ['sprintCohortId'] })
    }
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [signupOptions, setSignupOptions] = useState<{
        companies: { id: string, name: string }[],
        sprintWorkshops: { id: string, name: string }[]
    }>({ companies: [], sprintWorkshops: [] })
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const { token } = useParams()

    useEffect(() => {
        const fetchOptions = async () => {
            const { data, error } = await supabase.rpc('get_public_signup_options')
            if (!error && data) {
                setSignupOptions(data)
            }
        }
        fetchOptions()
    }, [])

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    })

    const joinType = watch('joinType')

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true)
        const { error } = await signUp(
            data.email,
            data.password,
            data.fullName,
            'participant',
            data.joinType === 'company' ? data.companyId : undefined,
            data.joinType === 'company' ? data.userType : undefined,
            data.joinType === 'individual' ? data.sprintCohortId : undefined
        )

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success('Account created! Please check your email to verify.')
        navigate('/login')
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left - Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-bg-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green/10 via-transparent to-lime/10" />

                {/* Skender Image */}
                <div className="absolute bottom-0 right-[-10%] w-[90%] max-w-3xl">
                    <motion.img
                        src={skenderImg}
                        alt="Skender"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full h-auto object-contain opacity-90 mix-blend-normal transition-all duration-700"
                    />
                </div>

                {/* Gradients moved to parent scope to prevent borders */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-bg-elevated/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg-elevated/90 via-bg-elevated/20 to-transparent" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Glow removed to prevent artifacts */}
                </div>
                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="hero-text text-5xl mb-6 drop-shadow-xl leading-tight">
                            JOIN THE
                            <br />
                            <span className="text-gradient">REVOLUTION</span>
                        </h2>
                        <p className="text-gray-200 max-w-md drop-shadow-md font-medium text-lg shadow-black/50">
                            Create your account to access the Zkandar AI Masterclass and
                            start your transformation journey.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <img src={logo} alt="Zkandar AI" className="h-20 w-auto object-contain" />
                        <div>
                            <h1 className="font-heading text-xl font-bold tracking-wide">
                                ZKANDAR AI
                            </h1>
                            <p className="text-xs text-gray-500 tracking-widest uppercase">
                                Masterclass Hub
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-heading font-bold mb-2">Create account</h2>
                    <p className="text-gray-400 mb-8">
                        {token
                            ? "You've been invited! Complete your registration."
                            : 'Start your AI learning journey today'}
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    {...register('fullName')}
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border rounded-xl
                    text-sm placeholder:text-gray-500 focus:outline-none focus:border-lime/50
                    transition-colors"
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Join Type Selection */}
                        <div className="pt-2">
                            <label className="block text-sm font-medium mb-3">How are you joining?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition ${joinType === 'company' ? 'border-lime bg-lime/10 text-lime' : 'border-border bg-bg-card hover:bg-white/5 text-gray-400'}`}>
                                    <input type="radio" value="company" className="sr-only" {...register('joinType')} />
                                    <Building2 className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">With a Company</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition ${joinType === 'individual' ? 'border-lime bg-lime/10 text-lime' : 'border-border bg-bg-card hover:bg-white/5 text-gray-400'}`}>
                                    <input type="radio" value="individual" className="sr-only" {...register('joinType')} />
                                    <UserCircle className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Sprint Workshop</span>
                                </label>
                            </div>
                            {errors.joinType && <p className="text-red-400 text-xs mt-2">{errors.joinType.message}</p>}
                        </div>

                        {/* Dynamic Fields based on Join Type */}
                        {joinType === 'company' && (
                            <div className="space-y-5 p-5 border border-border bg-black/20 rounded-2xl">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Select Company</label>
                                    <select
                                        {...register('companyId')}
                                        className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white appearance-none"
                                    >
                                        <option value="">-- Choose your company --</option>
                                        {signupOptions.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.companyId && <p className="text-red-400 text-xs mt-1">{errors.companyId.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Your Role inside Company</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-white/5 bg-bg-card">
                                            <input type="radio" value="management" {...register('userType')} className="text-lime focus:ring-lime" />
                                            <span className="text-sm font-medium">Management</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-white/5 bg-bg-card">
                                            <input type="radio" value="team" {...register('userType')} className="text-lime focus:ring-lime" />
                                            <span className="text-sm font-medium">Team Member</span>
                                        </label>
                                    </div>
                                    {errors.userType && <p className="text-red-400 text-xs mt-1">{errors.userType.message}</p>}
                                </div>
                            </div>
                        )}

                        {joinType === 'individual' && (
                            <div className="space-y-5 p-5 border border-border bg-black/20 rounded-2xl">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Select Sprint Workshop</label>
                                    <select
                                        {...register('sprintCohortId')}
                                        className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white appearance-none"
                                    >
                                        <option value="">-- Choose a workshop --</option>
                                        {signupOptions.sprintWorkshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                    {errors.sprintCohortId && <p className="text-red-400 text-xs mt-1">{errors.sprintCohortId.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="you@company.com"
                                    className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border rounded-xl
                    text-sm placeholder:text-gray-500 focus:outline-none focus:border-lime/50
                    transition-colors"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3 bg-bg-card border border-border rounded-xl
                    text-sm placeholder:text-gray-500 focus:outline-none focus:border-lime/50
                    transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    {...register('confirmPassword')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border rounded-xl
                    text-sm placeholder:text-gray-500 focus:outline-none focus:border-lime/50
                    transition-colors"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-400 text-xs mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 gradient-lime text-black font-bold rounded-xl
                hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-lime hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
