import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, Zap, Target, Users, ArrowRight, ShieldCheck, Clock, Palette } from 'lucide-react'

// Animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

export function LandingPageTest() {
    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative selection:bg-lime/30 selection:text-white">
            {/* Background Texture & Orb */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.03]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(208,255,113,0.15)_0%,transparent_70%)] blur-[80px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(90,159,46,0.1)_0%,transparent_70%)] blur-[100px]" />
            </div>

            <div className="relative z-10">
                {/* 1. Hero Section */}
                <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <Brain className="w-4 h-4" />
                        <span>Built for Architects & Space Designers</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[clamp(2.5rem,6vw,4.5rem)] font-heading font-black leading-[1.1] uppercase tracking-tight max-w-5xl mx-auto"
                    >
                        Stop Guessing with AI. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-green-500">
                            Start Designing With Precision.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-6 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium"
                    >
                        Learn the exact workflows trusted by top creative studios. Transform your ideation, concept creation, and rendering speed in days.
                    </motion.p>
                </section>

                {/* 2. The Problem (Data-Backed) */}
                <section className="py-20 px-6 bg-[#0a0a0a] border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-heading font-bold">The Creative AI Reality Check</h2>
                            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">We surveyed 200+ architects, interior designers, and event planners. The data shows a massive gap between expectations and reality.</p>
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            <motion.div variants={itemVariants} className="bg-bg-card border border-border rounded-3xl p-8 hover:border-lime/20 transition-colors">
                                <div className="text-lime font-heading font-black text-5xl mb-4">65%</div>
                                <h3 className="font-bold text-xl mb-3">Struggle with Control</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Are spending hours prompting but the outputs fall short of firm standards and client expectations.
                                </p>
                            </motion.div>
                            
                            <motion.div variants={itemVariants} className="bg-bg-card border border-border rounded-3xl p-8 hover:border-lime/20 transition-colors">
                                <div className="text-lime font-heading font-black text-5xl mb-4">82%</div>
                                <h3 className="font-bold text-xl mb-3">Workflow Disconnect</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Can generate a pretty image, but don’t know how to integrate AI legally and efficiently into actual project pipelines.
                                </p>
                            </motion.div>

                            <motion.div variants={itemVariants} className="bg-bg-card border border-border rounded-3xl p-8 hover:border-lime/20 transition-colors">
                                <div className="text-lime font-heading font-black text-5xl mb-4">2.4/5</div>
                                <h3 className="font-bold text-xl mb-3">Average Confidence</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Most teams self-report extremely low confidence in their AI skills, risking falling behind competitors who adapt.
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* 3. & 4. The Solution / How We Help */}
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-widest">
                                <Target className="w-4 h-4" />
                                <span>The Zkandar Method</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
                                From Random Outputs to Predictable Excellence.
                            </h2>
                            <p className="text-gray-400 text-lg">
                                We don't just teach you how to write prompts. We install robust, reliable AI systems tailored specifically for spatial and creative design.
                            </p>

                            <ul className="space-y-6 pt-4 mt-8 border-t border-white/10">
                                <li className="flex gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center text-lime">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">10x Concept Speed</h4>
                                        <p className="text-sm text-gray-400 mt-1">Iterate on massing, textures, and lighting in seconds rather than days.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center text-lime">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Guaranteed Quality Standards</h4>
                                        <p className="text-sm text-gray-400 mt-1">Harness advanced tools (Midjourney, ControlNet, Craya) to maintain absolute control over the final render.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center text-lime">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Future-Proof Workflows</h4>
                                        <p className="text-sm text-gray-400 mt-1">Seamlessly connect AI outputs with your existing tools like SketchUp, Rhino, and Revit.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="lg:w-1/2 relative">
                            {/* Decorative representation of the platform */}
                            <div className="relative aspect-square rounded-[40px] border border-white/10 bg-[#0a0a0a] overflow-hidden p-8 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-lime/5 to-transparent z-0" />
                                <div className="relative z-10 flex flex-col h-full gap-4">
                                    <div className="flex justify-between items-end pb-4 border-b border-white/5">
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 bg-white/10 rounded-full" />
                                            <div className="h-8 w-48 bg-white/20 rounded-md" />
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-[3px] border-lime flex items-center justify-center text-lime font-bold">
                                            86%
                                        </div>
                                    </div>
                                    <div className="flex-1 rounded-2xl bg-black border border-white/5 p-4 flex flex-col gap-3">
                                        <div className="text-xs uppercase tracking-widest text-lime">AI Readiness Score</div>
                                        <div className="flex gap-2 items-end flex-1">
                                            {[40, 65, 80, 50, 95].map((h, i) => (
                                                <div key={i} className="flex-1 bg-lime/20 rounded-t-md relative group">
                                                    <div 
                                                        className="absolute bottom-0 w-full rounded-t-md bg-lime transition-all duration-1000" 
                                                        style={{ height: `${h}%` }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-20 rounded-2xl bg-gradient-to-r from-lime/20 to-transparent border border-lime/30 p-4 flex items-center gap-4">
                                        <Palette className="text-lime w-6 h-6" />
                                        <div>
                                            <div className="text-sm font-bold text-white">Post-Program Growth</div>
                                            <div className="text-xs text-lime">+86% Improvement across cohort</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. CTA Section (Two paths) */}
                <section className="py-24 px-6 border-t border-white/5 bg-[radial-gradient(ellipse_at_top,rgba(208,255,113,0.05),transparent_50%)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-tight">Choose Your Path</h2>
                            <p className="text-gray-400 mt-4 max-w-xl mx-auto">Whether you're looking to upskill yourself or transform your entire studio, we have a specialized track for you.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Individual Path */}
                            <div className="bg-[#050505] border border-white/10 rounded-[32px] p-10 flex flex-col relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
                                    <Users className="text-white w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold font-heading mb-2">For Individuals</h3>
                                <div className="text-lime font-bold uppercase tracking-widest text-sm mb-6">Sprint Workshop</div>
                                <p className="text-gray-400 mb-8 flex-1">
                                    A fast-paced, highly focused workshop to master a specific AI ideation tool. Perfect for quick wins and immediate workflow integration.
                                </p>
                                <ul className="space-y-3 mb-10 text-sm text-gray-300">
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> 3-Day Intensive</li>
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> 2 Hours per day</li>
                                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> Concept creation & quick ideation</li>
                                </ul>
                                <button className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-wider hover:bg-lime transition-colors mt-auto flex items-center justify-center gap-2">
                                    Apply for Sprint <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Team Path */}
                            <div className="bg-[#0a0a0a] border border-lime/30 rounded-[32px] p-10 flex flex-col relative group overflow-hidden shadow-[0_0_40px_-10px_rgba(208,255,113,0.15)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-lime/10 to-transparent" />
                                <div className="absolute top-0 right-10 w-px h-24 bg-gradient-to-b from-lime to-transparent" />
                                
                                <div className="relative z-10">
                                    <div className="h-12 w-12 rounded-full bg-lime/20 flex items-center justify-center mb-6">
                                        <Building2 className="text-lime w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading mb-2">For Companies & Teams</h3>
                                    <div className="text-lime font-bold uppercase tracking-widest text-sm mb-6">The Master Class</div>
                                    <p className="text-gray-400 mb-8 flex-1">
                                        A comprehensive systemic overhaul. We align your firm's standards with AI capabilities, track team progress via dashboard, and certify readiness.
                                    </p>
                                    <ul className="space-y-3 mb-10 text-sm text-gray-300">
                                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> End-to-end curriculum</li>
                                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> Custom dashboard & analytics</li>
                                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> Team readiness certification</li>
                                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-lime" /> Advanced workflows (Render to completion)</li>
                                    </ul>
                                    <button className="w-full py-4 rounded-full bg-lime text-black font-bold uppercase tracking-wider hover:bg-[#b8f23e] transition-colors mt-auto flex items-center justify-center gap-2">
                                        Book Team Discovery <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Simple Footer */}
                <footer className="py-8 text-center border-t border-white/5">
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-heading font-bold">
                        © {new Date().getFullYear()} Zkandar AI
                    </p>
                </footer>
            </div>
        </div>
    )
}

function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}
