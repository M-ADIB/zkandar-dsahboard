import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoSrc from '../../assets/logo.png';

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
    intro_handler: string;
    has_qa: boolean;
    has_catering: boolean;
    available_tech: string[];
    parking_notes: string;
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
        event_type: 'AI Lunch & Learn',
        proposed_date: '',
        venue: '',
        audience_size: '',
        event_description: ''
    });

    const [step2Data, setStep2Data] = useState<Step2Data>({
        session_format: 'Solo presentation',
        duration: '60 min',
        has_moderator: false,
        intro_handler: '',
        has_qa: true,
        has_catering: false,
        available_tech: [],
        parking_notes: '',
        vip_notes: '',
        marketing_flyer: 'Our team will create it',
        contact_name: '',
        contact_phone: '',
        other_notes: ''
    });

    const techOptions = [
        'Large screen / Projector',
        'Lapel microphone',
        'Handheld microphone',
        'High-speed WiFi',
        'Backup laptop',
        'Presentation Clicker'
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
            const payload: any = {
                ...step1Data,
                audience_size: parseInt(step1Data.audience_size.toString()) || 0,
                ...step2Data,
                status: 'pending',
                admin_notes: null
            };

            const { error } = await supabase
                .from('event_requests')
                .insert([payload] as any);

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

    const inputCls = "w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors placeholder:text-gray-600 placeholder:text-sm placeholder:lowercase";
    const labelCls = "text-sm font-bold text-gray-300";

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.07]">
                    <img src={logoSrc} alt="" className="w-[300%] md:w-[250%] lg:w-[200%] max-w-none grayscale object-cover" />
                </div>
                <div className="max-w-md w-full text-center space-y-6 relative z-10">
                    <div className="w-16 h-16 bg-[#D0FF71]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-[#D0FF71]" />
                    </div>
                    <h1 className="text-3xl font-black font-neue tracking-wider">Request Received.</h1>
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
        <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D0FF71]/30 selection:text-white pb-24 relative overflow-hidden">
            {/* Ambient gradient */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Noise overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Huge background logo */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.07]">
                <img src={logoSrc} alt="" className="w-[300%] md:w-[250%] lg:w-[200%] max-w-none grayscale object-cover" />
            </div>

            <div className="max-w-2xl mx-auto px-6 pt-16 relative z-10">
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-12">
                    <img src={logoSrc} alt="Zkandar AI" className="h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-xl font-bold font-neue">Zkandar AI</span>
                </div>

                {/* Title & Breadcrumb */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-5xl font-black font-neue uppercase tracking-wider mb-3">
                        Book Khaled | AI Talk
                    </h1>
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
                                        <label className={labelCls}>Full Name *</label>
                                        <input required type="text" value={step1Data.full_name}
                                            onChange={e => setStep1Data({ ...step1Data, full_name: e.target.value })}
                                            className={inputCls} placeholder="ex. full name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Email Address *</label>
                                        <input required type="email" value={step1Data.email}
                                            onChange={e => setStep1Data({ ...step1Data, email: e.target.value })}
                                            className={inputCls} placeholder="ex. email address" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Company / Organization *</label>
                                        <input required type="text" value={step1Data.company}
                                            onChange={e => setStep1Data({ ...step1Data, company: e.target.value })}
                                            className={inputCls} placeholder="ex. company name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Your Role / Title *</label>
                                        <input required type="text" value={step1Data.role_title}
                                            onChange={e => setStep1Data({ ...step1Data, role_title: e.target.value })}
                                            className={inputCls} placeholder="ex. events manager" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelCls}>Event Type *</label>
                                    <select required value={step1Data.event_type}
                                        onChange={e => setStep1Data({ ...step1Data, event_type: e.target.value })}
                                        className={`${inputCls} appearance-none`}>
                                        <option>AI Lunch &amp; Learn</option>
                                        <option>AI Keynote</option>
                                        <option>AI Panel Discussion</option>
                                        <option>Community Event</option>
                                        <option>Product Launch</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelCls}>Proposed Date *</label>
                                        <input required type="date" value={step1Data.proposed_date}
                                            onChange={e => setStep1Data({ ...step1Data, proposed_date: e.target.value })}
                                            className={`${inputCls} [color-scheme:dark]`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Expected Audience Size *</label>
                                        <input required type="number" min="1" value={step1Data.audience_size}
                                            onChange={e => setStep1Data({ ...step1Data, audience_size: e.target.value })}
                                            className={inputCls} placeholder="ex. 100" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelCls}>Venue / Location *</label>
                                    <input required type="text" value={step1Data.venue}
                                        onChange={e => setStep1Data({ ...step1Data, venue: e.target.value })}
                                        className={inputCls} placeholder="ex. venue name and city" />
                                </div>

                                <div className="space-y-2">
                                    <label className={labelCls}>Brief Description of the Event *</label>
                                    <textarea required value={step1Data.event_description}
                                        onChange={e => setStep1Data({ ...step1Data, event_description: e.target.value })}
                                        rows={3} className={`${inputCls} resize-none`}
                                        placeholder="ex. describe the core theme and goal of this event" />
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

                                {/* Session Format & Duration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <label className={labelCls}>Session Format *</label>
                                        <select required value={step2Data.session_format}
                                            onChange={e => setStep2Data({ ...step2Data, session_format: e.target.value })}
                                            className={`${inputCls} appearance-none`}>
                                            <option>Solo presentation</option>
                                            <option>Panel</option>
                                            <option>Workshop</option>
                                            <option>Fireside chat</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Duration Needed *</label>
                                        <select required value={step2Data.duration}
                                            onChange={e => setStep2Data({ ...step2Data, duration: e.target.value })}
                                            className={`${inputCls} appearance-none`}>
                                            <option>30 min</option>
                                            <option>45 min</option>
                                            <option>60 min</option>
                                            <option>90 min</option>
                                            <option>Half-day</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Moderator + Q&A */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className={labelCls}>Will there be a moderator?</label>
                                        <div className="flex bg-[#0B0B0B] border border-gray-800 rounded-xl p-1">
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_moderator: true })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${step2Data.has_moderator ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>Yes</button>
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_moderator: false })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!step2Data.has_moderator ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>No</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className={labelCls}>Dedicated Q&A Session?</label>
                                        <div className="flex bg-[#0B0B0B] border border-gray-800 rounded-xl p-1">
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_qa: true })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${step2Data.has_qa ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>Yes</button>
                                            <button type="button" onClick={() => setStep2Data({ ...step2Data, has_qa: false })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!step2Data.has_qa ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>No</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Introduction Handler */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Who will handle the speaker introduction? (Optional)</label>
                                    <input type="text" value={step2Data.intro_handler}
                                        onChange={e => setStep2Data({ ...step2Data, intro_handler: e.target.value })}
                                        className={inputCls} placeholder="ex. event host, mc, or company representative" />
                                </div>

                                {/* Catering */}
                                <div className="space-y-3">
                                    <label className={labelCls}>Will refreshments / catering be available at the event?</label>
                                    <div className="flex bg-[#0B0B0B] border border-gray-800 rounded-xl p-1 max-w-xs">
                                        <button type="button" onClick={() => setStep2Data({ ...step2Data, has_catering: true })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${step2Data.has_catering ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>Yes</button>
                                        <button type="button" onClick={() => setStep2Data({ ...step2Data, has_catering: false })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!step2Data.has_catering ? 'bg-[#D0FF71] text-[#0B0B0B]' : 'text-gray-400 hover:text-white'}`}>No</button>
                                    </div>
                                </div>

                                {/* AV Setup */}
                                <div className="space-y-3">
                                    <label className={labelCls}>Available Tech / AV Setup *</label>
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

                                {/* Marketing Flyer */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Who will handle the marketing flyer?</label>
                                    <select required value={step2Data.marketing_flyer}
                                        onChange={e => setStep2Data({ ...step2Data, marketing_flyer: e.target.value })}
                                        className={`${inputCls} appearance-none`}>
                                        <option>Our team will create it</option>
                                        <option>We need Zkandar AI to provide it</option>
                                        <option>Not applicable (Internal event)</option>
                                    </select>
                                </div>

                                {/* Day-of Contact */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelCls}>Day-of Contact Name *</label>
                                        <input required type="text" value={step2Data.contact_name}
                                            onChange={e => setStep2Data({ ...step2Data, contact_name: e.target.value })}
                                            className={inputCls} placeholder="ex. contact person name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Day-of Contact Phone *</label>
                                        <input required type="tel" value={step2Data.contact_phone}
                                            onChange={e => setStep2Data({ ...step2Data, contact_phone: e.target.value })}
                                            className={inputCls} placeholder="ex. +971 50 000 0000" />
                                    </div>
                                </div>

                                {/* Parking */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Any special instructions for parking? (Optional)</label>
                                    <input type="text" value={step2Data.parking_notes}
                                        onChange={e => setStep2Data({ ...step2Data, parking_notes: e.target.value })}
                                        className={inputCls} placeholder="ex. valet available, visitor parking on level 2, etc." />
                                </div>

                                {/* VIP / Special */}
                                <div className="space-y-2">
                                    <label className={labelCls}>VIP Guests or Special Considerations? (Optional)</label>
                                    <textarea value={step2Data.vip_notes}
                                        onChange={e => setStep2Data({ ...step2Data, vip_notes: e.target.value })}
                                        rows={2} className={`${inputCls} resize-none`}
                                        placeholder="ex. seating protocol, security arrangements, etc." />
                                </div>

                                {/* Other Notes */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Anything else we should know? (Optional)</label>
                                    <textarea value={step2Data.other_notes}
                                        onChange={e => setStep2Data({ ...step2Data, other_notes: e.target.value })}
                                        rows={2} className={`${inputCls} resize-none`}
                                        placeholder="ex. any additional context or requests" />
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={isSubmitting}
                                    className="w-full py-4 bg-[#D0FF71] text-[#0B0B0B] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#bceb5f] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                                </button>

                                {/* Videographer Disclaimer */}
                                <p className="text-xs text-gray-500 text-center leading-relaxed">
                                    * Please note that Zkandar AI will be accompanied by our videographer to capture
                                    select moments and snippets of the event for our portfolio and social media channels.
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
