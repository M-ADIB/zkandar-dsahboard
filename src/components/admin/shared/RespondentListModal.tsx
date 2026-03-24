import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Building2, Mail } from 'lucide-react';
import { Portal } from '@/components/shared/Portal';

export interface RespondentData {
    id: string;
    name: string;
    email: string;
    company: string;
}

interface RespondentListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    respondents: RespondentData[];
}

export function RespondentListModal({
    isOpen,
    onClose,
    title,
    respondents,
}: RespondentListModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-black/20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-lime/10 border border-lime/20 flex flex-col items-center justify-center">
                                <Users className="h-5 w-5 text-lime" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                                <p className="text-xs text-gray-400">
                                    {respondents.length} total respondent{respondents.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                        {respondents.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                                <Users className="h-12 w-12 mb-3 opacity-20" />
                                <p>No respondents found.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {respondents.map((respondent, index) => (
                                    <div 
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/[0.05] flex items-center justify-center shrink-0">
                                                <span className="text-sm font-semibold text-gray-300">
                                                    {(respondent.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-white truncate">
                                                        {respondent.name || 'Unknown User'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{respondent.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-300 shrink-0 bg-white/[0.03] border border-white/[0.05] px-3 py-1.5 rounded-lg">
                                            <Building2 className="h-3.5 w-3.5 text-lime" />
                                            <span className="max-w-[150px] truncate">{respondent.company || 'Unknown Company'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
