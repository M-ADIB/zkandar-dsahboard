import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import logo from '@/assets/logo.png'
import skenderImg from '@/assets/skender.png'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const { signIn, sendMagicLink, user, loading } = useAuth()
    const navigate = useNavigate()

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/')
        }
    }, [user, loading, navigate])

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const email = watch('email')

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        const { error } = await signIn(data.email, data.password)

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success('Welcome back!')
        // Don't navigate here — the useEffect on line 28 will redirect
        // once the onAuthStateChange listener updates the user state.
        // We keep isLoading true so the button stays disabled.
    }

    const handleMagicLink = async () => {
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email first')
            return
        }

        setIsLoading(true)
        const { error } = await sendMagicLink(email)

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        setMagicLinkSent(true)
        setIsLoading(false)
        toast.success('Magic link sent! Check your email.')
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left - Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-bg-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-lime/10 via-transparent to-green/10" />

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
                            MASTER THE
                            <br />
                            <span className="text-gradient">AI FUTURE</span>
                        </h2>
                        <p className="text-gray-200 max-w-md drop-shadow-md font-medium text-lg shadow-black/50">
                            Join the Zkandar AI Masterclass and transform your architecture
                            practice with cutting-edge AI tools and techniques.
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

                    <h2 className="text-2xl font-heading font-bold mb-2">Welcome back</h2>
                    <p className="text-gray-400 mb-8">
                        Sign in to continue your learning journey
                    </p>

                    {magicLinkSent ? (
                        <div className="text-center p-8 bg-lime/5 border border-lime/20 rounded-2xl">
                            <Mail className="h-12 w-12 text-lime mx-auto mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Check your email!</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                We've sent a magic link to <strong>{email}</strong>
                            </p>
                            <button
                                onClick={() => setMagicLinkSent(false)}
                                className="text-lime text-sm hover:underline"
                            >
                                Try another method
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.password.message}
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
                                    'Sign In'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-2 bg-bg-primary text-gray-500">or</span>
                                </div>
                            </div>

                            {/* Magic Link */}
                            <button
                                type="button"
                                onClick={handleMagicLink}
                                disabled={isLoading}
                                className="w-full py-3 border border-border rounded-xl text-sm
                  hover:border-lime/50 transition-colors disabled:opacity-50"
                            >
                                Send Magic Link
                            </button>
                        </form>
                    )}

                    {/* Signup Link */}
                    <p className="mt-8 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-lime hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
