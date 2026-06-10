import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Upload, Cpu, PenTool, FileText, Image as ImageIcon, Sparkles, Award, FileSpreadsheet, Layout } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Portal } from '@/components/shared/Portal';
import { toast } from 'react-hot-toast';
import type { MasterclassProposal } from '@/pages/admin/ProposalsPage';

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    proposal?: MasterclassProposal | null;
}

interface ModuleData {
    num: string;
    title: string;
    icon: string;
    topics: string[];
}

const inputClass = 'w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all text-sm';
const labelClass = 'block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider';

const iconOptions = [
    { value: 'Cpu', label: 'CPU / Tech', icon: Cpu },
    { value: 'PenTool', label: 'Pen Tool / Prompting', icon: PenTool },
    { value: 'FileText', label: 'File Text / Documentation', icon: FileText },
    { value: 'ImageIcon', label: 'Image / Visuals', icon: ImageIcon },
    { value: 'Sparkles', label: 'Sparkles / Storytelling', icon: Sparkles },
    { value: 'Award', label: 'Award / Contest', icon: Award },
    { value: 'FileSpreadsheet', label: 'Spreadsheet / Technical', icon: FileSpreadsheet },
    { value: 'Layout', label: 'Layout / FF&E', icon: Layout }
];

export function ProposalModal({ isOpen, onClose, onSuccess, proposal }: ProposalModalProps) {
    const supabase = useSupabase();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [slug, setSlug] = useState('');
    const [preparedFor, setPreparedFor] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [preparedBy, setPreparedBy] = useState('Zkandar L.L.C');
    const [totalInvestment, setTotalInvestment] = useState(120000);
    const [duration, setDuration] = useState('2 Sessions (15 Hours total) + 3rd Dedicated troubleshooting session (scheduled post-masterclass).');
    const [deliveryFormat, setDeliveryFormat] = useState('In-Person at your studio.');
    const [teamCapacity, setTeamCapacity] = useState('Up to 20 Participants.');
    const [sessionStyle, setSessionStyle] = useState('Hands-On / Interactive / On-screen presentation.');
    
    // Arrays
    const [audienceInput, setAudienceInput] = useState('');
    const [whatsIncludedInput, setWhatsIncludedInput] = useState('');
    const [expectedOutcomesInput, setExpectedOutcomesInput] = useState('');

    // PDF files
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState('');

    // Modules
    const [modules, setModules] = useState<ModuleData[]>([]);

    useEffect(() => {
        if (proposal) {
            setSlug(proposal.slug);
            setPreparedFor(proposal.prepared_for);
            setCompanyName(proposal.company_name);
            setPreparedBy(proposal.prepared_by || 'Zkandar L.L.C');
            setTotalInvestment(proposal.total_investment);
            setDuration(proposal.duration);
            setDeliveryFormat(proposal.delivery_format);
            setTeamCapacity(proposal.team_capacity);
            setSessionStyle(proposal.session_style);
            
            setAudienceInput((proposal.recommended_audience || []).join('\n'));
            setWhatsIncludedInput((proposal.whats_included || []).join('\n'));
            setExpectedOutcomesInput((proposal.expected_outcomes || []).join('\n'));
            setPdfUrl(proposal.agreement_pdf_url || '');
            setModules(proposal.modules || []);
        } else {
            // Defaults
            setSlug('');
            setPreparedFor('');
            setCompanyName('');
            setPreparedBy('Zkandar L.L.C');
            setTotalInvestment(120000);
            setDuration('2 Sessions (15 Hours total) + 3rd Dedicated troubleshooting session (scheduled post-masterclass).');
            setDeliveryFormat('In-Person at your studio.');
            setTeamCapacity('Up to 20 Participants.');
            setSessionStyle('Hands-On / Interactive / On-screen presentation.');
            
            setAudienceInput([
                'Architects', 
                'Interior Designers', 
                'FF&E Teams', 
                'Visualization Teams', 
                'Design Directors', 
                'Creative Leads', 
                'Marketing Teams', 
                'Concept Development Teams'
            ].join('\n'));
            
            setWhatsIncludedInput([
                'Custom case studies specific to your projects',
                'Lifetime access to all session recordings',
                'Free e-prompt books and template kits',
                '60-day AI community support access',
                '3 hours of dedicated post-masterclass troubleshooting support',
                'Data-driven workflow analysis reports'
            ].join('\n'));
            
            setExpectedOutcomesInput([
                'Successful integration of AI workflows into daily studio operations',
                'Drastically reduced concept-to-presentation timelines',
                'Significantly improved design storytelling capabilities',
                'Consistently higher-quality and more controlled creative outputs',
                'repeatable, step-by-step systems established for the team',
                'Stronger client pitch and presentation confidence'
            ].join('\n'));
            
            setPdfUrl('');
            setPdfFile(null);
            
            // Initial modules list (default modules)
            setModules([
                {
                    num: "01",
                    title: "AI Landscape & Tool Ecosystem",
                    icon: "Cpu",
                    topics: ["Text tools vs image tools vs video tools", "AI workflow mapping", "Tool selection frameworks"]
                },
                {
                    num: "02",
                    title: "Claude Fundamentals & Prompt Craft",
                    icon: "PenTool",
                    topics: ["Context engineering & prompt structures", "Claude Projects setup & environments", "Feeding AI presentations, PDFs, references"]
                },
                {
                    num: "03",
                    title: "ON-SITE DOCUMENTATION",
                    icon: "FileText",
                    topics: ["AI assisted workflow for documentation", "Text + image to template migration"]
                },
                {
                    num: "04",
                    title: "AI Image Generation Workflows",
                    icon: "ImageIcon",
                    topics: ["Nano Banana + Cinematic workflows", "Prompt quality & control systems", "MaterialScaping & Moodboard creations", "Iterative output refinement"]
                },
                {
                    num: "05",
                    title: "The Art of Storytelling",
                    icon: "Sparkles",
                    topics: [
                        "Narrative-driven image generation", 
                        "Bespoke precedents & storytelling frameworks", 
                        "Cinematic short films & atmosphere building",
                        "Emotional sequencing & storyboarding",
                        "Brand assets & client immersion presentations"
                    ]
                },
                {
                    num: "06",
                    title: "Prize Money Competition",
                    icon: "Award",
                    topics: ["Moodboards & FF&E Design challenges", "Storytelling & narrative execution", "AI-generated consultant briefs"]
                }
            ]);
        }
    }, [proposal]);

    const handleAddModule = () => {
        const nextNum = String(modules.length + 1).padStart(2, '0');
        setModules([
            ...modules,
            {
                num: nextNum,
                title: 'New Syllabus Module',
                icon: 'Cpu',
                topics: ['First topic pointer']
            }
        ]);
    };

    const handleRemoveModule = (index: number) => {
        const updated = modules.filter((_, idx) => idx !== index).map((m, idx) => ({
            ...m,
            num: String(idx + 1).padStart(2, '0')
        }));
        setModules(updated);
    };

    const handleUpdateModule = (index: number, fields: Partial<ModuleData>) => {
        const updated = [...modules];
        updated[index] = { ...updated[index], ...fields };
        setModules(updated);
    };

    const handleUpdateModuleTopics = (index: number, text: string) => {
        const updated = [...modules];
        updated[index].topics = text.split('\n').map(t => t.trim()).filter(Boolean);
        setModules(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!slug.trim()) {
            setError('URL Slug is required.');
            return;
        }
        
        // Slug validation: letters, numbers, and dashes only
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug.trim())) {
            setError('Slug must contain only lowercase letters, numbers, and dashes (e.g. abu-abdullah).');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let agreementPdfUrl = pdfUrl;

            // Handle file upload
            if (pdfFile) {
                const fileExt = pdfFile.name.split('.').pop();
                const fileName = `${slug.trim()}-${Date.now()}.${fileExt}`;
                const filePath = `proposals/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('agreements')
                    .upload(filePath, pdfFile, {
                        cacheControl: '3600',
                        upsert: true
                    });
                    
                if (uploadError) {
                    throw new Error(`PDF Upload failed: ${uploadError.message}`);
                }
                
                const { data: publicUrlData } = supabase.storage
                    .from('agreements')
                    .getPublicUrl(filePath);
                    
                agreementPdfUrl = publicUrlData.publicUrl;
            }

            const payload = {
                slug: slug.trim(),
                prepared_for: preparedFor.trim(),
                company_name: companyName.trim(),
                prepared_by: preparedBy.trim(),
                total_investment: Number(totalInvestment),
                agreement_pdf_url: agreementPdfUrl || null,
                duration: duration.trim(),
                delivery_format: deliveryFormat.trim(),
                team_capacity: teamCapacity.trim(),
                session_style: sessionStyle.trim(),
                recommended_audience: audienceInput.split('\n').map(a => a.trim()).filter(Boolean),
                whats_included: whatsIncludedInput.split('\n').map(w => w.trim()).filter(Boolean),
                expected_outcomes: expectedOutcomesInput.split('\n').map(o => o.trim()).filter(Boolean),
                modules: modules,
                updated_at: new Date().toISOString()
            };

            if (proposal) {
                const { error: saveError } = await supabase
                    .from('masterclass_proposals')
                    .update(payload)
                    .eq('id', proposal.id);
                    
                if (saveError) throw new Error(saveError.message);
                toast.success('Proposal updated successfully');
            } else {
                const { error: saveError } = await supabase
                    .from('masterclass_proposals')
                    .insert(payload);
                    
                if (saveError) throw new Error(saveError.message);
                toast.success('Proposal created successfully');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'An error occurred saving the proposal.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-[28px] bg-[#0a0a0a] border border-white/[0.08] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0a0a0a] flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-white">{proposal ? 'Edit Client Proposal' : 'Create Client Proposal'}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Customize metadata, PDF agreements, and syllabus modules</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
                            {error && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {error}
                                </div>
                            )}

                            {/* Section 1: Metadata */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-lime">1. Metadata & General Settings</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>URL Slug / Endpoint</label>
                                        <input
                                            type="text"
                                            required
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase())}
                                            className={inputClass}
                                            placeholder="e.g. abu-abdullah"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Accessible at: /masterclass/{slug || '...'}</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Company Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. Al Jawaher Consultancy"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Prepared For (Client Name)</label>
                                        <input
                                            type="text"
                                            required
                                            value={preparedFor}
                                            onChange={(e) => setPreparedFor(e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. Abu Abdullah"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Prepared By</label>
                                        <input
                                            type="text"
                                            required
                                            value={preparedBy}
                                            onChange={(e) => setPreparedBy(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Total Investment (AED)</label>
                                        <input
                                            type="number"
                                            required
                                            value={totalInvestment}
                                            onChange={(e) => setTotalInvestment(Number(e.target.value))}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Services Agreement PDF</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                id="pdf-upload"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setPdfFile(e.target.files[0]);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="pdf-upload"
                                                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white cursor-pointer hover:bg-white/10 transition-all flex-1 justify-center"
                                            >
                                                <Upload className="h-3.5 w-3.5 text-lime" />
                                                {pdfFile ? pdfFile.name : (pdfUrl ? 'Replace Agreement' : 'Upload Agreement')}
                                            </label>
                                        </div>
                                        {pdfUrl && !pdfFile && (
                                            <p className="text-[10px] text-gray-500 truncate mt-1">Current PDF: {pdfUrl.split('/').pop()}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Logistics Specs */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-lime">2. Logistics & Program Specs</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Duration Detail</label>
                                        <input
                                            type="text"
                                            required
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Delivery Format</label>
                                        <input
                                            type="text"
                                            required
                                            value={deliveryFormat}
                                            onChange={(e) => setDeliveryFormat(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Team Capacity</label>
                                        <input
                                            type="text"
                                            required
                                            value={teamCapacity}
                                            onChange={(e) => setTeamCapacity(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Session Style</label>
                                        <input
                                            type="text"
                                            required
                                            value={sessionStyle}
                                            onChange={(e) => setSessionStyle(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Lists (Audience, Whats Included, Outcomes) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Recommended Audience (One per line)</label>
                                    <textarea
                                        rows={6}
                                        value={audienceInput}
                                        onChange={(e) => setAudienceInput(e.target.value)}
                                        className={`${inputClass} font-sans leading-relaxed resize-none`}
                                        placeholder="Architects&#10;Interior Designers"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>What's Included (One per line)</label>
                                    <textarea
                                        rows={6}
                                        value={whatsIncludedInput}
                                        onChange={(e) => setWhatsIncludedInput(e.target.value)}
                                        className={`${inputClass} font-sans leading-relaxed resize-none`}
                                        placeholder="Custom case studies&#10;Lifetime access"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Expected Outcomes (One per line)</label>
                                    <textarea
                                        rows={6}
                                        value={expectedOutcomesInput}
                                        onChange={(e) => setExpectedOutcomesInput(e.target.value)}
                                        className={`${inputClass} font-sans leading-relaxed resize-none`}
                                        placeholder="Workflow integration&#10;Reduced timelines"
                                    />
                                </div>
                            </div>

                            {/* Section 4: Syllabus Modules */}
                            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-lime">3. Syllabus Scope & Modules</h4>
                                    <button
                                        type="button"
                                        onClick={handleAddModule}
                                        className="flex items-center gap-1 text-[11px] font-bold text-lime bg-lime/10 border border-lime/20 px-2.5 py-1 rounded-full uppercase tracking-wider hover:bg-lime/20 transition-all"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add Module
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {modules.map((mod, index) => (
                                        <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3 relative group/mod">
                                            <div className="absolute right-4 top-4 flex items-center gap-2 opacity-50 group-hover/mod:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveModule(index)}
                                                    className="p-1 rounded bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    Module {mod.num}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="md:col-span-2">
                                                    <label className={labelClass}>Module Title</label>
                                                    <input
                                                        type="text"
                                                        value={mod.title}
                                                        onChange={(e) => handleUpdateModule(index, { title: e.target.value })}
                                                        required
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Icon Theme</label>
                                                    <select
                                                        value={mod.icon}
                                                        onChange={(e) => handleUpdateModule(index, { icon: e.target.value })}
                                                        className={inputClass}
                                                    >
                                                        {iconOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Topics / Pointers (One per line)</label>
                                                <textarea
                                                    rows={3}
                                                    value={mod.topics.join('\n')}
                                                    onChange={(e) => handleUpdateModuleTopics(index, e.target.value)}
                                                    className={`${inputClass} font-sans leading-relaxed resize-none`}
                                                    placeholder="Topic pointer 1&#10;Topic pointer 2"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 border-t border-white/[0.08] flex justify-end space-x-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-5 py-2 text-sm font-medium text-black gradient-lime rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
                                    {proposal ? 'Save Changes' : 'Publish Proposal'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
