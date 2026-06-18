import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Cohort, Company, User, UserRole, UserType } from '@/types/database';
import { logAudit } from '@/lib/audit';
import { Trash2, Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
    companies: Company[];
    programs: Cohort[];
    memberships: string[];
}

type UserFormData = {
    full_name: string;
    role: UserRole;
    user_type: UserType | '';
    company_id: string;
    nationality: string;
    age: string;
    position: string;
};

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'executive', label: 'Executive' },
    { value: 'participant', label: 'Participant' },
];

const userTypeOptions: { value: UserType | ''; label: string }[] = [
    { value: '', label: 'Unassigned' },
    { value: 'management', label: 'Management' },
    { value: 'team', label: 'Team' },
    { value: 'sprint_member', label: 'Sprint Member' },
    { value: 'webinar_member', label: 'Webinar Member' },
];

export function UserModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    companies,
    programs,
    memberships,
}: UserModalProps) {
    const supabase = useSupabase();
    const [formData, setFormData] = useState<UserFormData>({
        full_name: '',
        role: 'participant',
        user_type: '',
        company_id: '',
        nationality: '',
        age: '',
        position: '',
    });
    const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
    const [initialPrograms, setInitialPrograms] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [invoices, setInvoices] = useState<any[]>([]);
    const [nativePurchases, setNativePurchases] = useState<any[]>([]);
    const [invoiceName, setInvoiceName] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (file: File | null) => {
        setInvoiceFile(file);
        if (file && !invoiceName.trim()) {
            const cleanName = file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[_-]/g, " ")
                .trim();
            const formattedName = cleanName
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            setInvoiceName(formattedName);
        }
    };

    useEffect(() => {
        if (!user) {
            setInvoices([]);
            setNativePurchases([]);
            return;
        }

        setFormData({
            full_name: user.full_name,
            role: user.role,
            user_type: user.user_type ?? '',
            company_id: user.company_id ?? '',
            nationality: user.nationality ?? '',
            age: user.age ? String(user.age) : '',
            position: user.position ?? '',
        });
        setSelectedPrograms(memberships);
        setInitialPrograms(memberships);
        setError(null);

        // Load invoices from profile_data
        const profileInvoices = (user.profile_data as any)?.invoices || [];
        setInvoices(profileInvoices);

        // Fetch native purchases in parallel
        const fetchNativePurchases = async () => {
            const { data, error: fetchErr } = await supabase
                .from('webinar_purchases')
                .select('*')
                .or(`customer_email.ilike.${user.email},user_id.eq.${user.id}`)
                .in('status', ['completed', 'paid']);
            if (!fetchErr && data) {
                setNativePurchases(data);
            }
        };
        fetchNativePurchases();
    }, [user, memberships, isOpen]);

    const handleUploadInvoice = async () => {
        if (!user || !invoiceFile) return;
        setIsUploading(true);
        setError(null);
        try {
            const fileExt = invoiceFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { error: uploadErr } = await supabase.storage
                .from('invoices')
                .upload(filePath, invoiceFile, { upsert: true });
                
            if (uploadErr) throw uploadErr;
            
            const { data: urlData } = supabase.storage
                .from('invoices')
                .getPublicUrl(filePath);
                
            const newInvoice = {
                id: crypto.randomUUID(),
                name: invoiceName.trim() || invoiceFile.name,
                amount: parseFloat(invoiceAmount) || 0,
                url: urlData.publicUrl,
                uploaded_at: new Date().toISOString(),
                source: 'manual'
            };
            
            const nextInvoices = [...invoices, newInvoice];
            
            const { data: userData } = await (supabase
                .from('users' as any)
                .select('profile_data')
                .eq('id', user.id)
                .single() as any);
                
            const currentProfile = (userData?.profile_data as Record<string, any>) || {};
            const newProfile = {
                ...currentProfile,
                invoices: nextInvoices
            };
            
            const { error: dbErr } = await (supabase
                .from('users' as any)
                .update({ profile_data: newProfile })
                .eq('id', user.id) as any);
                
            if (dbErr) throw dbErr;
            
            setInvoices(nextInvoices);
            setInvoiceName('');
            setInvoiceAmount('');
            setInvoiceFile(null);
            toast.success('Invoice uploaded successfully!');
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to upload invoice.');
            toast.error(err.message || 'Failed to upload invoice.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!user) return;
        const nextInvoices = invoices.filter(inv => inv.id !== invoiceId);
        try {
            const { data: userData } = await (supabase
                .from('users' as any)
                .select('profile_data')
                .eq('id', user.id)
                .single() as any);
                
            const currentProfile = (userData?.profile_data as Record<string, any>) || {};
            const newProfile = {
                ...currentProfile,
                invoices: nextInvoices
            };
            
            const { error: dbErr } = await (supabase
                .from('users' as any)
                .update({ profile_data: newProfile })
                .eq('id', user.id) as any);
                
            if (dbErr) throw dbErr;
            
            setInvoices(nextInvoices);
            toast.success('Invoice removed successfully.');
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete invoice.');
        }
    };

    const programGroups = useMemo(() => {
        const sprint = programs.filter((program) => program.offering_type === 'sprint_workshop');
        const master = programs.filter((program) => program.offering_type === 'master_class');
        return { sprint, master };
    }, [programs]);

    const masterClassIds = useMemo(() => {
        return new Set(programGroups.master.map((program) => program.id));
    }, [programGroups.master]);

    const hasMasterClassSelection = useMemo(() => {
        return selectedPrograms.some((id) => masterClassIds.has(id));
    }, [selectedPrograms, masterClassIds]);

    const isCompanyMissing = !formData.company_id;

    const handleProgramToggle = (programId: string) => {
        const isSprint = programGroups.sprint.some(p => p.id === programId);

        setSelectedPrograms((prev) => {
            if (prev.includes(programId)) {
                return prev.filter(id => id !== programId);
            }

            if (isSprint) {
                // Remove all other sprint workshops from prev
                const sprintIds = new Set(programGroups.sprint.map(p => p.id));
                const filteredPrev = prev.filter(id => !sprintIds.has(id));
                return [...filteredPrev, programId];
            }

            return [...prev, programId];
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!formData.full_name.trim()) {
            setError('Full name is required.');
            return;
        }

        if (hasMasterClassSelection && isCompanyMissing) {
            setError('Master Class participants must be assigned to a company.');
            return;
        }

        setIsLoading(true);
        setError(null);

        let updatedProfileData = null;

        if (invoiceFile) {
            try {
                const fileExt = invoiceFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                
                const { error: uploadErr } = await supabase.storage
                    .from('invoices')
                    .upload(filePath, invoiceFile, { upsert: true });
                    
                if (uploadErr) throw uploadErr;
                
                const { data: urlData } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(filePath);
                    
                const newInvoice = {
                    id: crypto.randomUUID(),
                    name: invoiceName.trim() || invoiceFile.name,
                    amount: parseFloat(invoiceAmount) || 0,
                    url: urlData.publicUrl,
                    uploaded_at: new Date().toISOString(),
                    source: 'manual'
                };
                
                const nextInvoices = [...invoices, newInvoice];
                
                const { data: userData } = await (supabase
                    .from('users' as any)
                    .select('profile_data')
                    .eq('id', user.id)
                    .single() as any);
                    
                const currentProfile = (userData?.profile_data as Record<string, any>) || {};
                updatedProfileData = {
                    ...currentProfile,
                    invoices: nextInvoices
                };
                
                setInvoices(nextInvoices);
                setInvoiceName('');
                setInvoiceAmount('');
                setInvoiceFile(null);
                toast.success('Invoice uploaded successfully!');
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to upload invoice.');
                toast.error(err.message || 'Failed to upload invoice.');
                setIsLoading(false);
                return;
            }
        }

        const payload: Record<string, any> = {
            full_name: formData.full_name.trim(),
            role: formData.role,
            user_type: formData.user_type || null,
            company_id: formData.company_id || null,
            nationality: formData.nationality.trim() || null,
            age: formData.age ? parseInt(formData.age, 10) : null,
            position: formData.position.trim() || null,
        };

        if (updatedProfileData) {
            payload.profile_data = updatedProfileData;
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(payload)
            .eq('id', user.id);

        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        const toAdd = selectedPrograms.filter((id) => !initialPrograms.includes(id));
        const toRemove = initialPrograms.filter((id) => !selectedPrograms.includes(id));

        if (toAdd.length > 0) {
            const { error: addError } = await supabase
                .from('cohort_memberships')
                .insert(toAdd.map((cohort_id) => ({ user_id: user.id, cohort_id })));

            if (addError) {
                setError(addError.message);
                setIsLoading(false);
                return;
            }
        }

        if (toRemove.length > 0) {
            const { error: removeError } = await supabase
                .from('cohort_memberships')
                .delete()
                .eq('user_id', user.id)
                .in('cohort_id', toRemove);

            if (removeError) {
                setError(removeError.message);
                setIsLoading(false);
                return;
            }
        }

        void logAudit('user.update', 'user', user.id, { name: payload.full_name, role: payload.role });
        setIsLoading(false);
        onSuccess();
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Edit User' : 'Edit User'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-gray-400 focus:outline-none focus:border-lime/40 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    >
                        {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">User Type</label>
                    <select
                        value={formData.user_type}
                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value as UserType | '' })}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    >
                        {userTypeOptions.map((type) => (
                            <option key={type.value || 'none'} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company (Master Class)</label>
                <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                >
                    <option value="">Unassigned</option>
                    {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Position / Job Title</label>
                <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    placeholder="e.g. Senior Architect"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nationality</label>
                    <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                        placeholder="e.g. Canadian"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                        placeholder="e.g. 35"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-gray-300">Program Memberships</p>
                    <p className="text-xs text-gray-500">Assign sprint workshop or additional programs directly to the user.</p>
                </div>

                {programs.length === 0 ? (
                    <div className="text-xs text-gray-500">No programs available.</div>
                ) : (
                    <div className="space-y-4">
                        {programGroups.sprint.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Sprint Workshops</p>
                                {programGroups.sprint.map((program) => (
                                    <label key={program.id} className="flex items-start gap-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedPrograms.includes(program.id)}
                                            onChange={() => handleProgramToggle(program.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#0F1219] text-lime focus:ring-lime/50"
                                        />
                                        <span>{program.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {programGroups.master.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Master Classes</p>
                                {isCompanyMissing && (
                                    <p className="text-xs text-amber-400">
                                        Select a company to assign Master Class programs.
                                    </p>
                                )}
                                {programGroups.master.map((program) => (
                                    <label key={program.id} className="flex items-start gap-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedPrograms.includes(program.id)}
                                            disabled={isCompanyMissing && !selectedPrograms.includes(program.id)}
                                            onChange={() => handleProgramToggle(program.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#0F1219] text-lime focus:ring-lime/50 disabled:opacity-40"
                                        />
                                        <span>{program.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {user && (
                <>
                    <div className="border-t border-white/[0.08] my-6" />
                    
                    <div className="space-y-4 text-left">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Billing & Invoices</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Manage manual invoices or view native checkout history for this member.</p>
                        </div>
                        
                        {/* Native Checkouts */}
                        {nativePurchases.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-lime/80">Native Checkout Purchases</p>
                                <div className="space-y-2">
                                    {nativePurchases.map((purchase) => (
                                        <div key={purchase.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                            <div className="min-w-0 flex-1 mr-4">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {Array.isArray(purchase.products) ? purchase.products.join(', ') : 'Sprint Workshop'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Completed on {new Date(purchase.completed_at || purchase.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-sm font-mono font-semibold text-lime">
                                                    AED {((purchase.amount_total || 0) / 100).toFixed(2)}
                                                </span>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-lime/10 text-lime uppercase tracking-wider">
                                                    {purchase.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Manual Invoices List */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Manual Invoices</p>
                            {invoices.length === 0 ? (
                                <p className="text-xs text-gray-600 italic">No manual invoices uploaded yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {invoices.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                            <div className="min-w-0 flex-1 mr-4">
                                                <a 
                                                    href={inv.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-sm font-medium text-white hover:text-lime hover:underline truncate block"
                                                >
                                                    {inv.name}
                                                </a>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Uploaded on {new Date(inv.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {inv.amount > 0 && (
                                                    <span className="text-sm font-mono font-semibold text-white">
                                                        AED {inv.amount.toFixed(2)}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteInvoice(inv.id)}
                                                    className="p-1 text-gray-500 hover:text-red-400 transition"
                                                    title="Delete invoice"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Upload Form */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Upload New Invoice</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] text-gray-400 mb-1">Invoice Label (Auto-generated if empty)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Invoice #2026-001"
                                        value={invoiceName}
                                        onChange={(e) => setInvoiceName(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-gray-400 mb-1">Amount (AED, optional)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 8750.00"
                                        value={invoiceAmount}
                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[11px] text-gray-400 mb-2">Select Invoice File</label>
                                {!invoiceFile ? (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleFileChange(file);
                                        }}
                                        onClick={() => document.getElementById('invoice-file-input')?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                                            isDragging 
                                                ? 'border-lime bg-lime/10 text-lime scale-[0.99]' 
                                                : 'border-white/[0.08] hover:border-lime/40 bg-white/[0.01] hover:bg-white/[0.02] text-gray-400'
                                        }`}
                                    >
                                        <input
                                            id="invoice-file-input"
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <Upload className={`h-7 w-7 mb-2 transition-transform duration-200 ${isDragging ? 'scale-110 text-lime' : 'text-gray-500'}`} />
                                        <p className="text-xs font-semibold text-white">Drag & drop invoice file here or click to browse</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Supports PDF, PNG, JPG, JPEG, WEBP</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-lime/5 border border-lime/20 animate-fade-in">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 rounded-lg bg-lime/10 flex items-center justify-center text-lime shrink-0">
                                                    <FileText className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-white truncate">{invoiceFile.name}</p>
                                                    <p className="text-[10px] text-lime/80 mt-0.5 font-mono">
                                                        {(invoiceFile.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setInvoiceFile(null);
                                                    setInvoiceName('');
                                                }}
                                                className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                                title="Remove file"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between px-1 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1 text-lime/80">
                                                <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                                                Auto-saves when clicking "Save Changes" below
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleUploadInvoice}
                                                disabled={isUploading}
                                                className="font-bold text-lime hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 cursor-pointer"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    'Upload Immediately'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ModalForm>
    );
}
