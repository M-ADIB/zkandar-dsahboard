import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
    Clock, 
    Users, 
    FileText, 
    CheckCircle2, 
    Download, 
    Mail, 
    Globe, 
    Instagram, 
    Linkedin, 
    Sparkles, 
    Cpu, 
    Layout, 
    PenTool, 
    FileSpreadsheet, 
    Image as ImageIcon,
    Award,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';
import type { MasterclassProposal } from '@/pages/admin/ProposalsPage';
import logoSrc from '@/assets/logo.png';

// ─── Animation Wrapper ────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '' }: {
    children: React.ReactNode; delay?: number; className?: string
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >{children}</motion.div>
    );
}

// ─── Module Icon Mapper ──────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<any>> = {
    Cpu,
    PenTool,
    FileText,
    ImageIcon,
    Sparkles,
    Award,
    FileSpreadsheet,
    Layout
};

function getModuleIcon(iconName: string) {
    return iconMap[iconName] || HelpCircle;
}

export function DynamicMasterclassProposalPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const supabase = useSupabase();
    
    const [proposal, setProposal] = useState<MasterclassProposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProposal = async () => {
            if (!slug) return;
            setIsLoading(true);
            setError(null);
            
            try {
                const { data, error: fetchError } = await supabase
                    .from('masterclass_proposals')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (fetchError) {
                    throw new Error(fetchError.message);
                }
                
                if (!data) {
                    setError('Proposal not found');
                } else {
                    setProposal(data as MasterclassProposal);
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred loading the proposal.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposal();
    }, [slug, supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
                <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                <div className="h-10 w-10 rounded-full border-2 border-lime border-t-transparent animate-spin relative z-10" />
                <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-4 font-mono animate-pulse relative z-10">
                    Loading Tailored Proposal...
                </p>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center relative">
                <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                <div className="max-w-md space-y-6 relative z-10">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        Proposal Status
                    </span>
                    <h1 className="font-heading font-black uppercase text-2xl sm:text-3xl text-white">
                        {error === 'Proposal not found' ? 'Proposal Not Found' : 'Failed to Load Proposal'}
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed font-body">
                        The requested client proposal could not be retrieved. It may have been archived, or the link provided is incorrect.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all text-gray-300 hover:text-white"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Return to Platform
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden">
            <PublicNav />

            {/* Ambient Background Glows */}
            <div className="fixed top-[-10%] left-[-5%] w-[45%] h-[45%] bg-[#5A9F2E]/10 blur-[130px] rounded-full pointer-events-none z-0 animate-float-slow" />
            <div className="fixed bottom-[-15%] right-[-5%] w-[35%] h-[35%] bg-[#D0FF71]/6 blur-[120px] rounded-full pointer-events-none z-0 animate-float-slow-reverse" />

            {/* Grainy Noise Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Logo Watermark Background */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
                <img src={logoSrc} alt="" className="w-[85%] md:w-[60%] lg:w-[45%] max-w-[650px] grayscale object-contain" />
            </div>

            {/* Custom Animations Styles */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(25px, -15px) scale(1.04); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-25px, 20px) scale(1.02); }
                }
                .animate-float-slow { animation: float-slow 22s ease-in-out infinite; }
                .animate-float-slow-reverse { animation: float-slow-reverse 26s ease-in-out infinite; }
            `}</style>

            {/* Main Content Area */}
            <div className="max-w-[1120px] mx-auto px-5 sm:px-6 pt-28 pb-16 md:pt-32 md:pb-24 relative z-10 space-y-20">

                {/* ─── HERO SECTION: Tailored Client Header ─────────────────── */}
                <FadeIn>
                    <div className="space-y-6 text-center md:text-left">
                        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-lime font-body">
                            Tailored Studio Masterclass
                        </span>
                        
                        <h1 className="font-heading font-black uppercase text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95] text-white">
                            AI MASTERCLASS FOR TEAMS
                        </h1>
                        
                        <p className="text-gray-400 text-lg sm:text-xl font-body max-w-2xl font-light">
                            Services Agreement &amp; Scope Overview
                        </p>
                    </div>

                    {/* Client Metadata Card */}
                    <div className="mt-10 bg-[#111111] border-l-4 border-l-lime border-y border-r border-white/[0.06] rounded-r-3xl rounded-bl-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(208,255,113,0.02)]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                            <div>
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Prepared For</span>
                                <span className="text-white font-heading font-black text-sm uppercase tracking-wide">{proposal.prepared_for}</span>
                            </div>
                            <div className="border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-4 sm:pt-0 sm:pl-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Company</span>
                                <span className="text-white font-heading font-black text-sm uppercase tracking-wide">{proposal.company_name}</span>
                            </div>
                            <div className="border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-4 sm:pt-0 sm:pl-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Prepared By</span>
                                <span className="text-white font-heading font-black text-sm uppercase tracking-wide">{proposal.prepared_by}</span>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* ─── PROGRAM OVERVIEW ─────────────────────────────────────── */}
                <FadeIn>
                    <div className="space-y-8">
                        <div className="border-l-2 border-lime pl-4">
                            <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Program Overview</h2>
                            <p className="text-gray-400 text-sm mt-1">Foundations and core approach</p>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-6">
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-body">
                                This is a hands-on, studio-first training program designed to help architecture, interior design, and marketing teams integrate AI into real-world creative workflows.
                            </p>
                            <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-body">
                                The program is tailored around the client's workflow structure, project typologies, creative direction, and operational pain points, combining live demonstrations, hands-on exercises, real project simulations, prompt engineering systems, AI image workflows, and team-based implementation exercises.
                            </p>
                        </div>

                        {/* Key Objectives Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { text: "Compress concept-to-presentation timelines", icon: Clock },
                                { text: "Improve creative output quality", icon: Sparkles },
                                { text: "Develop stronger storytelling capabilities", icon: Award },
                                { text: "Increase workflow efficiency across departments", icon: Cpu },
                                { text: "Build repeatable AI systems for daily use", icon: FileText }
                            ].map((obj, i) => {
                                const Icon = obj.icon;
                                return (
                                    <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5 hover:border-lime/30 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_rgba(208,255,113,0.01)] flex flex-col justify-between min-h-[140px] group">
                                        <Icon className="w-6 h-6 text-lime group-hover:scale-110 transition-transform duration-300" />
                                        <p className="text-xs text-gray-300 leading-relaxed font-body mt-4">{obj.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </FadeIn>

                {/* ─── PROGRAM STRUCTURE DETAILS ────────────────────────────── */}
                <FadeIn>
                    <div className="space-y-8">
                        <div className="border-l-2 border-lime pl-4">
                            <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Program Structure</h2>
                            <p className="text-gray-400 text-sm mt-1">Delivery formats and specs</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Duration</span>
                                <p className="text-sm text-gray-300 leading-relaxed font-body">
                                    {proposal.duration}
                                </p>
                            </div>
                            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Delivery Format</span>
                                <p className="text-sm text-gray-300 leading-relaxed font-body">
                                    {proposal.delivery_format}
                                </p>
                            </div>
                            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Team Capacity</span>
                                <p className="text-sm text-gray-300 leading-relaxed font-body">
                                    {proposal.team_capacity}
                                </p>
                            </div>
                            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Session Style</span>
                                <p className="text-sm text-gray-300 leading-relaxed font-body">
                                    {proposal.session_style}
                                </p>
                            </div>
                        </div>

                        {/* Recommended Audience */}
                        {proposal.recommended_audience && proposal.recommended_audience.length > 0 && (
                            <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                                <h4 className="text-xs uppercase tracking-wider text-lime font-bold">Recommended Audience</h4>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.recommended_audience.map((tag, i) => (
                                        <span key={i} className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>

                {/* ─── SCOPE OF THE MASTERCLASS (Syllabus Grid) ──────────────── */}
                {proposal.modules && proposal.modules.length > 0 && (
                    <FadeIn>
                        <div className="space-y-8">
                            <div className="border-l-2 border-lime pl-4">
                                <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Scope &amp; Modules</h2>
                                <p className="text-gray-400 text-sm mt-1">Deep-dive syllabus mapping</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {proposal.modules.map((mod: any, i: number) => {
                                    const IconComponent = getModuleIcon(mod.icon);
                                    return (
                                        <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-3xl p-6 space-y-4 hover:border-lime/20 hover:shadow-[0_0_40px_rgba(208,255,113,0.03)] transition-all duration-300 flex flex-col justify-between group">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        Module {mod.num || String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <IconComponent className="w-5 h-5 text-gray-500 group-hover:text-lime transition-colors duration-300" />
                                                </div>
                                                <h3 className="font-heading font-black uppercase text-sm sm:text-base text-white tracking-wide leading-snug">
                                                    {mod.title}
                                                </h3>
                                                {mod.topics && mod.topics.length > 0 && (
                                                    <ul className="space-y-2 pt-2">
                                                        {mod.topics.map((t: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-400 font-body leading-relaxed">
                                                                <span className="text-lime mt-0.5 shrink-0">•</span>
                                                                <span>{t}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </FadeIn>
                )}

                {/* ─── WHAT'S INCLUDED VS EXPECTED OUTCOMES ─────────────────── */}
                <FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* What's Included */}
                        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-6">
                            <h3 className="font-heading font-black uppercase text-base sm:text-lg text-lime tracking-wider border-b border-white/[0.06] pb-4">
                                What's Included
                            </h3>
                            {proposal.whats_included && proposal.whats_included.length > 0 ? (
                                <ul className="space-y-4">
                                    {proposal.whats_included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm text-gray-300 leading-relaxed font-body">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No inclusions specified.</p>
                            )}
                        </div>

                        {/* Expected Outcomes */}
                        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-6">
                            <h3 className="font-heading font-black uppercase text-base sm:text-lg text-lime tracking-wider border-b border-white/[0.06] pb-4">
                                Expected Outcomes
                            </h3>
                            {proposal.expected_outcomes && proposal.expected_outcomes.length > 0 ? (
                                <ul className="space-y-4">
                                    {proposal.expected_outcomes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm text-gray-300 leading-relaxed font-body">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No outcomes specified.</p>
                            )}
                        </div>
                    </div>
                </FadeIn>

                {/* ─── COMMERCIAL TERMS ─────────────────────────────────────── */}
                <FadeIn>
                    <div className="bg-[#111111] border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_0_40px_rgba(208,255,113,0.03)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A9F2E]/10 blur-[90px] rounded-full pointer-events-none" />
                        
                        <div className="border-l-2 border-lime pl-4">
                            <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Commercial Proposal</h2>
                            <p className="text-gray-400 text-sm mt-1">Financial investment &amp; agreements</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 items-center">
                            <div className="space-y-3">
                                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total Investment</span>
                                <div className="text-lime font-heading text-4xl sm:text-5xl font-black tracking-wide leading-none">
                                    AED {proposal.total_investment?.toLocaleString() || '120,000'}
                                </div>
                                <span className="block text-xs text-gray-400 italic font-body">
                                    All-inclusive studio license package {proposal.slug === 'anne-korbien' && '(VAT inclusive)'}
                                </span>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm text-gray-400 leading-relaxed font-body border-t md:border-t-0 md:border-l border-white/[0.08] pt-6 md:pt-0 md:pl-8">
                                <p>
                                    Full payment is required in advance in order to officially secure the engagement, reserve dates, and begin the Masterclass customization and structuring phase.
                                </p>
                                <p>
                                    Customization prep phase duration is typically <strong className="text-white">2-3 weeks</strong> prior to session kickoffs.
                                </p>
                                <div className="pt-2">
                                    <a href="/terms" className="text-xs uppercase tracking-wider text-gray-500 hover:text-lime underline transition-colors">
                                        Read terms of service
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* ─── NEXT STEPS ───────────────────────────────────────────── */}
                <FadeIn>
                    <div className="space-y-8">
                        <div className="border-l-2 border-lime pl-4">
                            <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Next Steps</h2>
                            <p className="text-gray-400 text-sm mt-1">Execution phase onboarding checklist</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                {
                                    step: "01",
                                    title: "Tax Registration & Invoicing",
                                    desc: "We require your tax registration details so we can supply you with the official invoice to initiate internal financial procurement cycles."
                                },
                                {
                                    step: "02",
                                    title: "Logistics Coordination Call",
                                    desc: "Schedule a brief logistics call to align on calendar dates, presentation setup, and team software/hardware readiness."
                                },
                                {
                                    step: "03",
                                    title: "Team Structure Questionnaire",
                                    desc: "Submit a simple list detailing the team structure, experience levels, and primary creative tooling software currently used."
                                }
                            ].map((step, i) => (
                                <div key={i} className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 space-y-3 relative hover:border-white/[0.1] transition-all duration-300">
                                    <span className="font-heading font-black text-lime/40 text-3xl block leading-none">{step.step}</span>
                                    <h4 className="font-heading font-black uppercase text-xs sm:text-sm text-white tracking-wide">{step.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed font-body">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* ─── EMBEDDED PDF SERVICE AGREEMENT ────────────────────────── */}
                {proposal.agreement_pdf_url && (
                    <FadeIn>
                        <div className="space-y-6">
                            <div className="border-l-2 border-lime pl-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="font-heading font-black uppercase text-xl sm:text-2xl text-white">Services Agreement Document</h2>
                                    <p className="text-gray-400 text-sm mt-1">Full inline agreement draft view</p>
                                </div>
                                <div className="shrink-0">
                                    <a 
                                        href={proposal.agreement_pdf_url} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="text-lime hover:text-white inline-flex items-center gap-2 uppercase tracking-wider text-xs font-bold font-body transition-colors border border-lime/20 bg-lime/5 hover:bg-lime/10 px-4 py-2.5 rounded-xl"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download Agreement (PDF)
                                    </a>
                                </div>
                            </div>

                            {/* PDF Frame */}
                            <div className="bg-[#111111] border border-white/[0.06] rounded-3xl p-2 sm:p-4 overflow-hidden shadow-inner">
                                <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-white/[0.04]">
                                    <iframe 
                                        src={`${proposal.agreement_pdf_url}#toolbar=0`} 
                                        className="w-full h-full bg-[#111111] rounded-2xl"
                                        title="AI Masterclass Services Agreement"
                                    />
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                )}

                {/* ─── ABOUT SECTION & CONTACT INFO ─────────────────────────── */}
                <FadeIn>
                    <div className="border-t border-white/[0.06] pt-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* About Zkandar */}
                            <div className="space-y-4">
                                <h3 className="font-heading font-black uppercase text-sm sm:text-base text-white tracking-wider">
                                    About Zkandar L.L.C
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-body">
                                    Zkandar L.L.C is an EdTech enterprise dedicated to AI integration within creative fields. Founded by Khaled Iskandar, Zkandar specializes in design workflow automation, bespoke prompt frameworks, and cinematic visual systems.
                                </p>
                                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-body">
                                    We have delivered advanced training sessions, talks, and masterclasses for design consultancies and institutions globally, including Skidmore, Owings &amp; Merrill (SOM), LW Design Group, Dubai Institute of Design and Innovation (DIDI), and more.
                                </p>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-4 md:pl-10 md:border-l border-white/[0.06]">
                                <h3 className="font-heading font-black uppercase text-sm sm:text-base text-white tracking-wider">
                                    Founder Contacts
                                </h3>
                                
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-lime">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase tracking-wider text-gray-600 font-bold">Founder &amp; Lead Instructor</span>
                                            <span className="text-xs sm:text-sm text-white font-heading uppercase font-bold tracking-wide">Khaled Iskandar</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-lime">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase tracking-wider text-gray-600 font-bold">Email Address</span>
                                            <a href="mailto:khaled@zkandar.com" className="text-xs sm:text-sm text-white hover:text-lime font-body transition-colors underline">
                                                khaled@zkandar.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-lime">
                                            <Globe className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase tracking-wider text-gray-600 font-bold">Official Website</span>
                                            <a href="https://www.zkandar.com" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-white hover:text-lime font-body transition-colors underline">
                                                www.zkandar.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-1">
                                        <a href="https://www.instagram.com/zkandar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lime transition-colors inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold font-body">
                                            <Instagram className="w-4 h-4" />
                                            @zkandar
                                        </a>
                                        <a href="https://linkedin.com/in/zkandar/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lime transition-colors inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold font-body">
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

            </div>

            <PublicFooter />
        </div>
    );
}
