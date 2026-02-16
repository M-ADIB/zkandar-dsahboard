import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { UserModal } from '@/components/admin/users/UserModal';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);

        const [usersResult, companiesResult, programsResult, membershipsResult] = await Promise.all([
            supabase.from('users').select('*').order('full_name'),
            supabase.from('companies').select('*').order('name'),
            supabase.from('cohorts').select('*').order('start_date', { ascending: false }),
            supabase.from('cohort_memberships').select('*'),
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

        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

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
                <span className="px-2 py-1 text-xs rounded-lg border border-gray-700 text-gray-300">
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
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-gray-400 mt-1">Manage roles, companies, and program memberships</p>
                </div>
            </div>

            <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4 flex flex-wrap gap-4">
                <div className="min-w-[240px] flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name or email..."
                            className="w-full pl-9 pr-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                        />
                    </div>
                </div>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
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
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
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
        </div>
    );
}
