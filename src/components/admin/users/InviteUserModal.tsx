import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Cohort, Company, UserRole } from '@/types/database';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companies: Company[];
    programs: Cohort[];
}

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'participant', label: 'Participant' },
    { value: 'executive', label: 'Executive' },
    { value: 'admin', label: 'Admin' },
];

export function InviteUserModal({
    isOpen,
    onClose,
    onSuccess,
    companies,
    programs,
}: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('participant');
    const [companyId, setCompanyId] = useState('');
    const [cohortId, setCohortId] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const reset = () => {
        setEmail('');
        setRole('participant');
        setCompanyId('');
        setCohortId('');
        setError(null);
        setDone(false);
        setIsSending(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        setIsSending(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            setError('You are not authenticated.');
            setIsSending(false);
            return;
        }

        const res = await supabase.functions.invoke('invite-user', {
            body: {
                email: email.trim().toLowerCase(),
                role,
                company_id: companyId || undefined,
                cohort_id: cohortId || undefined,
            },
        });

        if (res.error || (res.data as { error?: string })?.error) {
            const msg = res.error?.message ?? (res.data as { error?: string }).error ?? 'Failed to send invite.';
            setError(msg);
            setIsSending(false);
            return;
        }

        setDone(true);
        setTimeout(() => {
            reset();
            onSuccess();
        }, 1400);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                    className="relative z-10 w-full max-w-md rounded-2xl bg-bg-elevated border border-border shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                                <UserPlus className="h-4.5 w-4.5 h-5 w-5 text-lime" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white">Invite User</h2>
                                <p className="text-xs text-gray-500">Send an invite email to join the platform</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {done ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                                className="h-14 w-14 rounded-full bg-lime/10 flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-7 w-7 text-lime" />
                            </motion.div>
                            <p className="text-sm font-medium text-white">Invite sent!</p>
                            <p className="text-xs text-gray-500 text-center max-w-xs">
                                {email} will receive a magic-link to join.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Email address <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@company.com"
                                        className="w-full pl-9 pr-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/50 transition-colors placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                                <div className="flex gap-2">
                                    {roleOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRole(opt.value)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${role === opt.value
                                                ? 'bg-lime/10 border-lime/30 text-lime'
                                                : 'bg-bg-card border-border text-gray-400 hover:border-lime/20'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Company */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Company (optional)</label>
                                <select
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/50 transition-colors"
                                >
                                    <option value="">No company</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cohort */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Program / Cohort (optional)</label>
                                <select
                                    value={cohortId}
                                    onChange={(e) => setCohortId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/50 transition-colors"
                                >
                                    <option value="">No cohort</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="px-5 py-2 rounded-xl text-sm font-medium gradient-lime text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSending ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
