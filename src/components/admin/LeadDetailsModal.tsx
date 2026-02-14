
import { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead } from '@/types/database';

interface LeadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSave: (updatedLead: Lead) => Promise<void>;
    onDelete?: (lead: Lead) => Promise<void>;
}

export function LeadDetailsModal({ isOpen, onClose, lead, onSave, onDelete }: LeadDetailsModalProps) {
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'financial' | 'schedule' | 'notes'>('details');

    useEffect(() => {
        if (lead) {
            setFormData(lead);
        }
    }, [lead]);

    if (!lead) return null;

    const handleInputChange = (field: keyof Lead, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData as Lead);
            onClose();
        } catch (error) {
            console.error('Error saving lead:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'details', label: 'Details', icon: User },
        { id: 'financial', label: 'Financial', icon: DollarSign },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'notes', label: 'Notes', icon: FileText },
    ] as const;

    const isPaidDeposit = formData.paid_deposit === true;
    const isPaidFull = formData.paid_full === true;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-dashboard-bg border-l border-gray-800 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-dashboard-card">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-dashboard-accent/10 flex items-center justify-center text-dashboard-accent">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{formData.full_name || 'Lead Details'}</h2>
                                    <p className="text-sm text-gray-400">{formData.email || 'No email provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(lead)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete Lead"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-800 bg-dashboard-card/50 px-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                        ? 'text-dashboard-accent border-dashboard-accent'
                                        : 'text-gray-400 border-transparent hover:text-gray-200'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Full Name</span>
                                            <input
                                                type="text"
                                                value={formData.full_name || ''}
                                                onChange={e => handleInputChange('full_name', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Email</span>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={e => handleInputChange('email', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Phone</span>
                                            <input
                                                type="text"
                                                value={formData.phone || ''}
                                                onChange={e => handleInputChange('phone', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Company</span>
                                            <input
                                                type="text"
                                                value={formData.company_name || ''}
                                                onChange={e => handleInputChange('company_name', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Job Title</span>
                                            <input
                                                type="text"
                                                value={formData.job_title || ''}
                                                onChange={e => handleInputChange('job_title', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Instagram</span>
                                            <input
                                                type="text"
                                                value={formData.instagram || ''}
                                                onChange={e => handleInputChange('instagram', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Country</span>
                                            <input
                                                type="text"
                                                value={formData.country || ''}
                                                onChange={e => handleInputChange('country', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">City</span>
                                            <input
                                                type="text"
                                                value={formData.city || ''}
                                                onChange={e => handleInputChange('city', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                    </div>
                                    <label className="md:col-span-2 block">
                                        <span className="text-sm text-gray-400 mb-1 block">Description</span>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={e => handleInputChange('description', e.target.value)}
                                            rows={3}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent resize-none"
                                        />
                                    </label>
                                </div>
                            )}

                            {activeTab === 'financial' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Total Payment</span>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                                <input
                                                    type="number"
                                                    value={formData.payment_amount ?? 0}
                                                    onChange={e => handleInputChange('payment_amount', e.target.value === '' ? null : parseFloat(e.target.value))}
                                                    className="w-full bg-dashboard-card border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                                />
                                            </div>
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Balance</span>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                                <input
                                                    type="number"
                                                    value={formData.balance || 0}
                                                    onChange={e => handleInputChange('balance', parseFloat(e.target.value))}
                                                    className="w-full bg-dashboard-card border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                                />
                                            </div>
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Amount Paid (1st)</span>
                                            <input
                                                type="number"
                                                value={formData.amount_paid || 0}
                                                onChange={e => handleInputChange('amount_paid', parseFloat(e.target.value))}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <input
                                                type="number"
                                                value={formData.amount_paid_2 || 0}
                                                onChange={e => handleInputChange('amount_paid_2', parseFloat(e.target.value))}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Balance (2nd)</span>
                                            <input
                                                type="number"
                                                value={formData.balance_2 || 0}
                                                onChange={e => handleInputChange('balance_2', parseFloat(e.target.value))}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                    </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-dashboard-card rounded-lg border border-gray-800">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-white">Paid Deposit</span>
                                                <button
                                                    onClick={() => {
                                                        handleInputChange('paid_deposit', !isPaidDeposit);
                                                    }}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${isPaidDeposit
                                                            ? 'bg-dashboard-accent'
                                                            : 'bg-gray-700'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPaidDeposit
                                                            ? 'left-7'
                                                            : 'left-1'
                                                        }`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-white">Paid Full</span>
                                                <button
                                                    onClick={() => {
                                                        handleInputChange('paid_full', !isPaidFull);
                                                    }}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${isPaidFull
                                                            ? 'bg-green-500'
                                                            : 'bg-gray-700'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPaidFull
                                                            ? 'left-7'
                                                            : 'left-1'
                                                        }`} />
                                                </button>
                                            </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Payment Plan</span>
                                            <input
                                                type="text"
                                                value={formData.payment_plan || ''}
                                                onChange={e => handleInputChange('payment_plan', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="block">
                                                <span className="text-sm text-gray-400 mb-1 block">Coupon Code</span>
                                                <input
                                                    type="text"
                                                    value={formData.coupon_code || ''}
                                                    onChange={e => handleInputChange('coupon_code', e.target.value)}
                                                    className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm text-gray-400 mb-1 block">Coupon %</span>
                                                <input
                                                    type="number"
                                                    value={formData.coupon_percent || 0}
                                                    onChange={e => handleInputChange('coupon_percent', parseInt(e.target.value))}
                                                    className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Priority Status</span>
                                        <select
                                            value={formData.priority || 'COLD'}
                                            onChange={e => handleInputChange('priority', e.target.value)}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="HOT">HOT</option>
                                            <option value="COLD">COLD</option>
                                            <option value="LAVA">LAVA</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="NOT INTERESTED">NOT INTERESTED</option>
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Discovery Call Date</span>
                                        <input
                                            type="date"
                                            value={formData.discovery_call_date || ''}
                                            onChange={e => handleInputChange('discovery_call_date', e.target.value)}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        />
                                    </label>
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">Start Date</span>
                                            <input
                                                type="date"
                                                value={formData.start_date || ''}
                                                onChange={e => handleInputChange('start_date', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-gray-400 mb-1 block">End Date</span>
                                            <input
                                                type="date"
                                                value={formData.end_date || ''}
                                                onChange={e => handleInputChange('end_date', e.target.value)}
                                                className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                            />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Day Slot</span>
                                        <input
                                            type="text"
                                            value={formData.day_slot || ''}
                                            onChange={e => handleInputChange('day_slot', e.target.value)}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Time Slot</span>
                                        <input
                                            type="text"
                                            value={formData.time_slot || ''}
                                            onChange={e => handleInputChange('time_slot', e.target.value)}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Offering Type</span>
                                        <input
                                            type="text"
                                            value={formData.offering_type || ''}
                                            onChange={e => handleInputChange('offering_type', e.target.value)}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Sessions Done</span>
                                        <input
                                            type="number"
                                            value={formData.sessions_done || 0}
                                            onChange={e => handleInputChange('sessions_done', parseInt(e.target.value))}
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-dashboard-accent"
                                        />
                                    </label>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-sm text-gray-400 mb-1 block">Interaction History & Notes</span>
                                        <textarea
                                            value={formData.notes || ''}
                                            onChange={e => handleInputChange('notes', e.target.value)}
                                            rows={15}
                                            placeholder="Enter notes about calls, follow-ups, or special requirements..."
                                            className="w-full bg-dashboard-card border border-gray-700 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-dashboard-accent resize-none font-sans leading-relaxed"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-800 bg-dashboard-card flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
