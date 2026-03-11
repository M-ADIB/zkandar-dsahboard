import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoSrc from '../../assets/logo.png';

interface Step1Data {
    full_name: string;
    email: string;
    phone: string;
    linkedin_url: string;
    instagram_url: string;
    gender: string;
    country: string;
    timezone: string;
}

interface Step2Data {
    years_experience: string;
    sold_info_products: string;
    avg_deal_size: string;
    expected_monthly_earnings: string;
    video_intro_url: string;
}

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
    "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
    "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export const ApplySalesPage = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [step1Data, setStep1Data] = useState<Step1Data>({
        full_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        instagram_url: '',
        gender: '',
        country: '',
        timezone: '',
    });

    const [step2Data, setStep2Data] = useState<Step2Data>({
        years_experience: '',
        sold_info_products: '',
        avg_deal_size: '',
        expected_monthly_earnings: '',
        video_intro_url: '',
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step1Data.gender !== 'Female') {
            alert('This position is exclusively for female closers.');
            return;
        }
        setIsSubmitting(true);
        try {
            const { data: inserted, error } = await supabase
                .from('job_applications')
                .insert([{
                    position_type: 'sales_closer',
                    ...step1Data,
                    ...step2Data,
                    status: 'new',
                }] as any)
                .select('id')
                .single();

            if (error) throw error;

            // Notify admin — failure here must not block the success screen
            if (inserted?.id) {
                supabase.functions.invoke('notify-admin-application', {
                    body: { applicationId: inserted.id },
                }).catch((err) => console.error('Admin notification failed:', err));
            }

            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Submission error:', err);
            alert('Something went wrong. Please try again or contact us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const inputCls = "w-full bg-[#0B0B0B] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D0FF71] transition-colors placeholder:text-gray-600 placeholder:text-sm placeholder:lowercase font-sans";
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
                    <h1 className="text-3xl font-black font-neue tracking-wider">Application Received.</h1>
                    <p className="text-gray-400 font-medium leading-relaxed">
                        Thanks for applying to the High-Ticket Closer role at Zkandar AI. We review every application personally. If you're the right fit, you'll hear from us soon.
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

            {/* Background logo watermark */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.07]">
                <img src={logoSrc} alt="" className="w-[300%] md:w-[250%] lg:w-[200%] max-w-none grayscale object-cover" />
            </div>

            <div className="max-w-2xl mx-auto px-6 pt-16 relative z-10">
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-12">
                    <img src={logoSrc} alt="Zkandar AI" className="h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-xl font-bold font-neue">Zkandar AI</span>
                </div>

                {/* Title & Step Indicator */}
                <div className="mb-8">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#D0FF71]/10 border border-[#D0FF71]/20 text-[#D0FF71] text-xs font-bold uppercase tracking-widest mb-4">
                        Open Position — Fully Remote
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black font-neue uppercase tracking-wider mb-3">
                        Female High-Ticket Closer
                    </h1>
                    <p className="text-gray-400 font-medium mb-4 leading-relaxed">
                        We're Zkandar AI — we teach architecture and interior design studios how to integrate AI into their workflow. We're exclusively looking for female high-ticket closers.
                    </p>
                    <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                        <span className={step >= 1 ? 'text-[#D0FF71]' : ''}>Step 1. Contact Info</span>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className={step >= 2 ? 'text-[#D0FF71]' : ''}>Step 2. Your Experience</span>
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
                                        <input
                                            required
                                            type="text"
                                            value={step1Data.full_name}
                                            onChange={e => setStep1Data({ ...step1Data, full_name: e.target.value })}
                                            className={inputCls}
                                            placeholder="ex. your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Email Address *</label>
                                        <input
                                            required
                                            type="email"
                                            value={step1Data.email}
                                            onChange={e => setStep1Data({ ...step1Data, email: e.target.value })}
                                            className={inputCls}
                                            placeholder="ex. your email address"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>WhatsApp / Phone *</label>
                                        <input
                                            required
                                            type="tel"
                                            value={step1Data.phone}
                                            onChange={e => setStep1Data({ ...step1Data, phone: e.target.value })}
                                            className={inputCls}
                                            placeholder="ex. +971 50 000 0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>LinkedIn Profile URL</label>
                                        <input
                                            type="url"
                                            value={step1Data.linkedin_url}
                                            onChange={e => setStep1Data({ ...step1Data, linkedin_url: e.target.value })}
                                            className={inputCls}
                                            placeholder="ex. linkedin.com/in/yourname"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Instagram Profile URL *</label>
                                        <input
                                            required
                                            type="url"
                                            value={step1Data.instagram_url}
                                            onChange={e => setStep1Data({ ...step1Data, instagram_url: e.target.value })}
                                            className={inputCls}
                                            placeholder="ex. instagram.com/yourname"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Gender *</label>
                                        <select
                                            required
                                            value={step1Data.gender}
                                            onChange={e => setStep1Data({ ...step1Data, gender: e.target.value })}
                                            className={`${inputCls} appearance-none`}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Country of Residence *</label>
                                        <input
                                            required
                                            list="country-options"
                                            value={step1Data.country}
                                            onChange={e => setStep1Data({ ...step1Data, country: e.target.value })}
                                            className={inputCls}
                                            placeholder="Type to search country..."
                                        />
                                        <datalist id="country-options">
                                            {COUNTRIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Your Timezone *</label>
                                        <select
                                            required
                                            value={step1Data.timezone}
                                            onChange={e => setStep1Data({ ...step1Data, timezone: e.target.value })}
                                            className={`${inputCls} appearance-none`}
                                        >
                                            <option value="">Select your timezone</option>
                                            <option value="GMT+4 (UAE / Gulf)">GMT+4 — UAE / Gulf</option>
                                            <option value="GMT+3 (Saudi Arabia / Kuwait / Qatar)">GMT+3 — Saudi Arabia / Kuwait / Qatar</option>
                                            <option value="GMT+5 (Pakistan)">GMT+5 — Pakistan / Maldives</option>
                                            <option value="GMT+2 (Egypt / Levant)">GMT+2 — Egypt / Jordan / Lebanon</option>
                                            <option value="Other — willing to adapt to Gulf hours">Other — willing to adapt to Gulf hours</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Role brief */}
                                <div className="p-4 rounded-xl bg-[#D0FF71]/5 border border-[#D0FF71]/15 space-y-2">
                                    <p className="text-xs font-bold text-[#D0FF71] uppercase tracking-widest">Position Brief</p>
                                    <ul className="text-sm text-gray-400 space-y-1 leading-relaxed">
                                        <li>→ Fully remote, Gulf hours preferred (GMT+4)</li>
                                        <li>→ Commission-only position</li>
                                        <li>→ Up to 2 years in high-ticket sales</li>
                                        <li className="font-sans">→ Deals range from $3,000 to $25,000</li>
                                        <li>→ Product: AI workshops and masterclasses for architecture & design studios</li>
                                    </ul>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-[#D0FF71] text-[#0B0B0B] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#bceb5f] transition-colors flex items-center justify-center space-x-2"
                                >
                                    <span>Continue to Experience</span>
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
                                className="space-y-8"
                            >
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="text-gray-400 hover:text-white flex items-center space-x-1 text-sm font-bold transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Contact Info</span>
                                </button>

                                {/* Years Experience + Info Products */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelCls}>Years in high-ticket sales *</label>
                                        <select
                                            required
                                            value={step2Data.years_experience}
                                            onChange={e => setStep2Data({ ...step2Data, years_experience: e.target.value })}
                                            className={`${inputCls} appearance-none`}
                                        >
                                            <option value="">Select range</option>
                                            <option value="Less than 6 months">Less than 6 months</option>
                                            <option value="6 months – 1 year">6 months – 1 year</option>
                                            <option value="1 – 2 years">1 – 2 years</option>
                                            <option value="2 – 3 years">2 – 3 years</option>
                                            <option value="3 – 5 years">3 – 5 years</option>
                                            <option value="5+ years">5+ years</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Average deal size in your last role *</label>
                                        <select
                                            required
                                            value={step2Data.avg_deal_size}
                                            onChange={e => setStep2Data({ ...step2Data, avg_deal_size: e.target.value })}
                                            className={`${inputCls} appearance-none`}
                                        >
                                            <option value="">Select range</option>
                                            <option value="Under $1,000">Under $1,000</option>
                                            <option value="$1,000 – $3,000">$1,000 – $3,000</option>
                                            <option value="$3,000 – $5,000">$3,000 – $5,000</option>
                                            <option value="$5,000 – $10,000">$5,000 – $10,000</option>
                                            <option value="$10,000 – $25,000">$10,000 – $25,000</option>
                                            <option value="$25,000+">$25,000+</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sold Info Products */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Have you sold info products or online education before? *</label>
                                    <select
                                        required
                                        value={step2Data.sold_info_products}
                                        onChange={e => setStep2Data({ ...step2Data, sold_info_products: e.target.value })}
                                        className={`${inputCls} appearance-none`}
                                    >
                                        <option value="">Select an option</option>
                                        <option value="Yes — it's my primary background">Yes — it's my primary background</option>
                                        <option value="Yes — among other verticals">Yes — among other verticals</option>
                                        <option value="No — but I've closed other high-ticket services">No — but I've closed other high-ticket services</option>
                                    </select>
                                </div>

                                {/* Expected Earnings */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Expected monthly earnings target (USD) *</label>
                                    <input
                                        required
                                        type="text"
                                        value={step2Data.expected_monthly_earnings}
                                        onChange={e => setStep2Data({ ...step2Data, expected_monthly_earnings: e.target.value })}
                                        className={inputCls}
                                        placeholder="ex. $8,000 / month"
                                    />
                                </div>

                                {/* Video Intro */}
                                <div className="space-y-2">
                                    <label className={labelCls}>Video introduction link *</label>
                                    <input
                                        required
                                        type="url"
                                        value={step2Data.video_intro_url}
                                        onChange={e => setStep2Data({ ...step2Data, video_intro_url: e.target.value })}
                                        className={inputCls}
                                        placeholder="ex. loom.com/share/... or youtube.com/..."
                                    />
                                    <p className="text-xs text-gray-600">A 1–2 minute video on why you're the right hire. (Required)</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-[#D0FF71] text-[#0B0B0B] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#bceb5f] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                                </button>

                                <p className="text-xs text-gray-500 text-center leading-relaxed">
                                    We review every application personally. Only candidates who are a strong fit will be contacted.
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
