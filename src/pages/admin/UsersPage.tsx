import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Mail, Clock, Trash2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/shared/Portal';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { SelectionActionBar } from '@/components/admin/shared/SelectionActionBar';
import { BulkDeleteConfirm } from '@/components/admin/shared/BulkDeleteConfirm';
import { UserModal } from '@/components/admin/users/UserModal';
import { InviteUserModal } from '@/components/admin/users/InviteUserModal';
import type { Cohort, CohortMembership, Company, User, UserRole, UserType } from '@/types/database';

type RoleFilter = 'all' | UserRole;
type TypeFilter = 'all' | UserType | 'unassigned';

const roleLabel: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    executive: 'Executive',
    participant: 'Participant',
};

export function UsersPage() {
    const supabase = useSupabase();
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [memberships, setMemberships] = useState<CohortMembership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useSessionStorage('users_search', '');
    const [roleFilter, setRoleFilter] = useSessionStorage<RoleFilter>('users_role', 'all');
    const [typeFilter, setTypeFilter] = useSessionStorage<TypeFilter>('users_type', 'all');
    const [invitations, setInvitations] = useState<{ id: string; email: string; role: string; status: string; created_at: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const { session } = useAuth();

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);

        const [usersResult, companiesResult, programsResult, membershipsResult, invitationsResult] = await Promise.all([
            supabase.from('users').select('*').order('full_name'),
            supabase.from('companies').select('*').order('name'),
            supabase.from('cohorts').select('*').order('start_date', { ascending: false }),
            supabase.from('cohort_memberships').select('*'),
            supabase.from('invitations').select('id,email,role,status,created_at').eq('status', 'pending').order('created_at', { ascending: false }),
        ]);

        if (usersResult.error) {
            setError(usersResult.error.message);
            setUsers([]);
        } else {
            setUsers((usersResult.data as User[]) ?? []);
        }

        if (companiesResult.error) {
            setError(companiesResult.error.message);
            setCompanies([]);
        } else {
            setCompanies((companiesResult.data as Company[]) ?? []);
        }

        if (programsResult.error) {
            setError(programsResult.error.message);
            setPrograms([]);
        } else {
            setPrograms((programsResult.data as Cohort[]) ?? []);
        }

        if (membershipsResult.error) {
            setError(membershipsResult.error.message);
            setMemberships([]);
        } else {
            setMemberships((membershipsResult.data as CohortMembership[]) ?? []);
        }

        if (!invitationsResult.error) {
            setInvitations((invitationsResult.data as { id: string; email: string; role: string; status: string; created_at: string }[]) ?? []);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteConfirm = async () => {
        if (!userToDelete || !session?.access_token) return;
        setIsDeleting(true);
        setError(null);
    
        try {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ user_id: userToDelete.id })
            });
    
            const data = await res.json();
            
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to delete user');
            }
    
            toast.success(`User ${userToDelete.full_name} deleted successfully from Zkandar AI.`);
            
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!session?.access_token) return;
        setIsBulkDeleting(true);
        let successCount = 0;
        for (const userId of selectedIds) {
            try {
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({ user_id: userId }),
                });
                if (res.ok) successCount++;
            } catch { /* skip failed */ }
        }
        setIsBulkDeleting(false);
        if (successCount > 0) {
            toast.success(`${successCount} member${successCount !== 1 ? 's' : ''} deleted`);
            setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
        }
        setSelectedIds([]);
        setShowBulkDeleteConfirm(false);
    };

    const handleBulkEdit = () => {
        const item = filteredUsers.find((u) => u.id === selectedIds[0]);
        if (item) { setSelectedUser(item); setIsModalOpen(true); }
    };

    const companyMap = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);
    const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs]);

    const membershipMap = useMemo(() => {
        const map = new Map<string, string[]>();
        memberships.forEach((membership) => {
            const existing = map.get(membership.user_id) ?? [];
            map.set(membership.user_id, [...existing, membership.cohort_id]);
        });
        return map;
    }, [memberships]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.nationality && user.nationality.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.position && user.position.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;

            const matchesType = typeFilter === 'all'
                ? true
                : typeFilter === 'unassigned'
                    ? !user.user_type
                    : user.user_type === typeFilter;

            return matchesSearch && matchesRole && matchesType;
        });
    }, [users, searchQuery, roleFilter, typeFilter]);

    const columns = useMemo(() => [
        {
            header: 'Name',
            accessor: 'full_name' as keyof User,
            className: 'font-medium text-white',
        },
        {
            header: 'Email',
            accessor: 'email' as keyof User,
        },
        {
            header: 'Role',
            accessor: (user: User) => (
                <span className="px-2 py-1 text-xs rounded-lg border border-border text-gray-300">
                    {roleLabel[user.role]}
                </span>
            ),
        },
        {
            header: 'Type',
            accessor: (user: User) => user.user_type ? user.user_type : 'Unassigned',
        },
        {
            header: 'Company',
            accessor: (user: User) => {
                if (!user.company_id) return '—';
                const company = companyMap.get(user.company_id);
                return company ? company.name : '—';
            },
        },
        {
            header: 'Position',
            accessor: (user: User) => user.position || '—',
            className: 'text-gray-400',
        },
        {
            header: 'Nationality',
            accessor: (user: User) => user.nationality || '—',
            className: 'text-gray-400',
        },
        {
            header: 'Age',
            accessor: (user: User) => user.age ?? '—',
        },
        {
            header: 'Programs',
            accessor: (user: User) => {
                const programIds = new Set(membershipMap.get(user.id) ?? []);
                const company = user.company_id ? companyMap.get(user.company_id) : null;
                if (company?.cohort_id) {
                    programIds.add(company.cohort_id);
                }

                const programNames = Array.from(programIds)
                    .map((id) => programMap.get(id)?.name)
                    .filter(Boolean) as string[];

                if (programNames.length === 0) return '—';

                const primary = programNames.slice(0, 2).join(', ');
                const remaining = programNames.length - 2;
                return remaining > 0 ? `${primary} +${remaining}` : primary;
            },
            className: 'whitespace-normal text-gray-400',
        },
    ], [companyMap, membershipMap, programMap]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Members</h1>
                    <p className="text-gray-400 mt-1">Manage roles, companies, and program memberships</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            onEdit={handleBulkEdit}
                            onDelete={() => setShowBulkDeleteConfirm(true)}
                        />
                    )}
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-lime text-black hover:opacity-90 transition"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-4 flex flex-wrap gap-4">
                <div className="min-w-[240px] flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name or email..."
                            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                        />
                    </div>
                </div>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    >
                        <option value="all">All Roles</option>
                        {Object.entries(roleLabel).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">User Type</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    >
                        <option value="all">All Types</option>
                        <option value="management">Management</option>
                        <option value="team">Team</option>
                        <option value="unassigned">Unassigned</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={filteredUsers}
                columns={columns}
                isLoading={isLoading}
                onEdit={(user) => {
                    setSelectedUser(user);
                    setIsModalOpen(true);
                }}
                onDelete={(user) => {
                    setUserToDelete(user);
                }}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            {selectedUser && (
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                        fetchUsers();
                    }}
                    user={selectedUser}
                    companies={companies}
                    programs={programs}
                    memberships={membershipMap.get(selectedUser.id) ?? []}
                />
            )}

            {invitations.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Clock className="h-4 w-4 text-lime" />
                            Pending Invitations ({invitations.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="h-8 w-8 rounded-full bg-lime/10 flex items-center justify-center shrink-0">
                                    <Mail className="h-3.5 w-3.5 text-lime" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{inv.email}</p>
                                    <p className="text-xs text-gray-500 capitalize mt-0.5">{inv.role} &bull; Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-xs border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <InviteUserModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onSuccess={() => {
                    setIsInviteOpen(false);
                    fetchUsers();
                }}
                companies={companies}
                programs={programs}
            />

            <AnimatePresence>
                {userToDelete && (
                    <Portal>
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isDeleting && setUserToDelete(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-[#0a0a0a] border border-white/[0.08] shadow-2xl p-6 flex flex-col items-center text-center"
                            >
                                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                    <Trash2 className="h-7 w-7 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Delete User</h3>
                                
                                <p className="text-sm text-gray-300 mb-8 leading-relaxed">
                                    Are you sure you want to permanently delete <strong className="text-white">{userToDelete.full_name}</strong>? All associated data including memberships, applications, and authentication records will be erased. This action cannot be undone.
                                </p>
            
                                <div className="flex justify-center w-full space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setUserToDelete(null)}
                                        disabled={isDeleting}
                                        className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Yes, delete user'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            <BulkDeleteConfirm
                isOpen={showBulkDeleteConfirm}
                count={selectedIds.length}
                isLoading={isBulkDeleting}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                itemLabel="member"
            />
        </div>
    );
}
