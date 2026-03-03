import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Step 1 Basics
interface Step1Data {
    full_name: string;
    email: string;
    company: string;
    role_title: string;
    event_type: string;
    proposed_date: string;
    venue: string;
    audience_size: string | number;
    event_description: string;
}

// Step 2 Logistics
interface Step2Data {
    session_format: string;
    duration: string;
    has_moderator: boolean;
    has_qa: boolean;
    available_tech: string[];
    vip_notes: string;
    marketing_flyer: string;
    contact_name: string;
    contact_phone: string;
    other_notes: string;
}

export const EventsApplyPage = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [step1Data, setStep1Data] = useState<Step1Data>({
        full_name: '',
        email: '',
        company: '',
        role_title: '',
        event_type: 'Corporate Keynote',
        proposed_date: '',
        venue: '',
        audience_size: '',
        event_description: ''
    });

    const [step2Data, setStep2Data] = useState<Step2Data>({
        session_format: 'Solo presentation',
        duration: '60 min',
        has_moderator: false,
        has_qa: true,
        available_tech: [],
        vip_notes: '',
        marketing_flyer: 'Yes',
        contact_name: '',
        contact_phone: '',
        other_notes: ''
    });

    const techOptions = [
        'Large screen / Projector',
        'Lapel microphone',
        'Handheld microphone',
        'High-speed WiFi',
        'Backup laptop'
    ];

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('event_requests')
                .insert([{
                    ...step1Data,
                    audience_size: parseInt(step1Data.audience_size.toString()) || 0,
                    ...step2Data
                }]);

            if (error) throw error;
            setIsSuccess(true);
        } catch (err) {
            console.error('Submission error:', err);
            alert('Encountered an error while submitting. Please try again or contact support.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTech = (tech: string) => {
        setStep2Data(prev => ({
            ...prev,
            available_tech: prev.available_tech.includes(tech)
                ? prev.available_tech.filter(t => t !== tech)
                : [...prev.available_tech, tech]
        }));
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-[#D0FF71]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-[#D0FF71]" />
                    </div>
                    <h1 className="text-3xl font-black font-neue tracking-tight">Request Received.</h1>
                    <p className="text-gray-400 font-medium">
                        Thank you for reaching out to book Khaled Iskandar. Our operations team will review your request and get back to you shortly.
                    </p>
                    <button
                        onClick={() => window.location.href = 'https://zkandar.com'}
                        className="mt-8 px-6 py-3 bg-[#111111] border border-gray-800 rounded-xl text-white font-bold hover:bg-gray-800 transition-colors w-full"
                    >
                        Back to Zkandar AI
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D0FF71]/30 selection:text-white pb-24 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat relative">
            {/* Ambient gradients matching branding */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full point-events-none" />

            <div className="max-w-2xl mx-auto px-6 pt-16 relative z-10">
                <div className="flex items-center space-x-3 mb-12">
                    <img src="/logo.png" alt="Zkandar AI" className="h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-xl font-bold font-neue">Zkandar AI</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl md:text-5xl font-black font-neue uppercase tracking-tight mb-3">Book Khaled for a Talk</h1>
                    <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                        <span className={step >= 1 ? 'text-[#D0FF71]' : ''}>Step 1. Basics</span>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className={step >= 2 ? 'text-[#D0FF71]' : ''}>Step 2. Logistics</span>
                    </div>
                </div>

                <div className="bg-[#111111] border border-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleNext}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Full Name *</label>
                                        <input required type="text" value={step1Data.full_name} onChange={e => setStep1Data({ ...step1Data, full_name: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Email Address *</label>
                                        <input required type="email" value={step1Data.email} onChange={e => setStep1Data({ ...step1Data, email: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="jane@company.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Company / Organization *</label>
                                        <input required type="text" value={step1Data.company} onChange={e => setStep1Data({ ...step1Data, company: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="Acme Corp" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Your Role / Title *</label>
                                        <input required type="text" value={step1Data.role_title} onChange={e => setStep1Data({ ...step1Data, role_title: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="Events Manager" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Event Type *</label>
                                    <select required value={step1Data.event_type} onChange={e => setStep1Data({ ...step1Data, event_type: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors appearance-none">
                                        <option>Corporate Keynote</option>
                                        <option>Panel Discussion</option>
                                        <option>Conference Session</option>
                                        <option>Community Event</option>
                                        <option>Product Launch</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Proposed Date / Month *</label>
                                        <input required type="text" value={step1Data.proposed_date} onChange={e => setStep1Data({ ...step1Data, proposed_date: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="e.g. Second week of April 2026" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Expected Audience Size *</label>
                                        <input required type="number" min="1" value={step1Data.audience_size} onChange={e => setStep1Data({ ...step1Data, audience_size: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="100" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Venue / Location *</label>
                                    <input required type="text" value={step1Data.venue} onChange={e => setStep1Data({ ...step1Data, venue: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="Hyatt Regency, Dubai" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Brief Description of the Event *</label>
                                    <textarea required value={step1Data.event_description} onChange={e => setStep1Data({ ...step1Data, event_description: e.target.value })} rows={3} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors resize-none" placeholder="What is the core theme and goal of this event?" />
                                </div>

                                <button type="submit" className="w-full py-4 bg-[#D0FF71] text-[#0B0B0B] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#bceb5f] transition-colors flex items-center justify-center space-x-2">
                                    <span>Continue to Logistics</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                <button type="button" onClick={handleBack} className="text-gray-400 hover:text-white flex items-center space-x-1 text-sm font-bold transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Basics</span>
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Session Format *</label>
                                        <select required value={step2Data.session_format} onChange={e => setStep2Data({ ...step2Data, session_format: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors appearance-none">
                                            <option>Solo presentation</option>
                                            <option>Panel</option>
                                            <option>Workshop</option>
                                            <option>Fireside chat</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Duration Needed *</label>
                                        <select required value={step2Data.duration} onChange={e => setStep2Data({ ...step2Data, duration: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors appearance-none">
                                            <option>30 min</option>
                                            <option>45 min</option>
                                            <option>60 min</option>
                                            <option>90 min</option>
                                            <option>Half-day</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-300">Will there be a moderator?</label>
                                        <div className="flex bg-[#0B0B0B] border border-gray-800 rounded-xl p-1">
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_moderator: true })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${step2Data.has_moderator ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>Yes</button>
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_moderator: false })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!step2Data.has_moderator ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>No</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-300">Dedicated Q&A Session?</label>
                                        <div className="flex bg-[#0B0B0B] border border-gray-800 rounded-xl p-1">
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_qa: true })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${step2Data.has_qa ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>Yes</button>
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_qa: false })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!step2Data.has_qa ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>No</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-300">Available Tech / AV Setup *</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {techOptions.map((tech) => (
                                            <label key={tech} className="flex items-center space-x-3 p-3 border border-gray-800 rounded-xl bg-[#0B0B0B] cursor-pointer hover:border-gray-600 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={step2Data.available_tech.includes(tech)}
                                                    onChange={() => toggleTech(tech)}
                                                    className="w-5 h-5 accent-[#D0FF71] bg-gray-900 border-gray-700 rounded"
                                                />
                                                <span className="text-sm text-gray-300 font-medium">{tech}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Who will handle the marketing flyer?</label>
                                    <select required value={step2Data.marketing_flyer} onChange={e => setStep2Data({ ...step2Data, marketing_flyer: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors appearance-none">
                                        <option>Our team will create it</option>
                                        <option>We need Zkandar AI to provide it</option>
                                        <option>Not applicable (Internal event)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Day-of Contact Name *</label>
                                        <input required type="text" value={step2Data.contact_name} onChange={e => setStep2Data({ ...step2Data, contact_name: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="Contact person" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">Day-of Contact Phone *</label>
                                        <input required type="tel" value={step2Data.contact_phone} onChange={e => setStep2Data({ ...step2Data, contact_phone: e.target.value })} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors" placeholder="+971 50..." />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">VIP Guests or Special Considerations? (Optional)</label>
                                    <textarea value={step2Data.vip_notes} onChange={e => setStep2Data({ ...step2Data, vip_notes: e.target.value })} rows={2} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors resize-none" placeholder="Is there seating protocol, security, etc?" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Anything else we should know? (Optional)</label>
                                    <textarea value={step2Data.other_notes} onChange={e => setStep2Data({ ...step2Data, other_notes: e.target.value })} rows={2} className="w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors resize-none" />
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#D0FF71] text-[#0B0B0B] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#bceb5f] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
