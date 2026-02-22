import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { CompanyModal } from '@/components/admin/company/CompanyModal';
import { Plus, Building2, Users, GraduationCap, ExternalLink } from 'lucide-react';
import { formatDateLabel } from '@/lib/time';
import type { Cohort, Company, User } from '@/types/database';

export function CompaniesPage() {
    const supabase = useSupabase();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const fetchCompanies = async () => {
        setIsLoading(true);
        setError(null);

        const [companiesResult, programsResult, usersResult] = await Promise.all([
            supabase.from('companies').select('*').order('name'),
            supabase.from('cohorts').select('*').eq('offering_type', 'master_class').order('start_date', { ascending: false }),
            supabase.from('users').select('*').order('full_name'),
        ]);

        if (companiesResult.error) { setError(companiesResult.error.message); setCompanies([]); }
        else { setCompanies((companiesResult.data as Company[]) ?? []); }

        if (programsResult.error) { setError(programsResult.error.message); setPrograms([]); }
        else { setPrograms((programsResult.data as Cohort[]) ?? []); }

        if (usersResult.error) { setError(usersResult.error.message); setUsers([]); }
        else { setUsers((usersResult.data as User[]) ?? []); }

        setIsLoading(false);
    };

    useEffect(() => { fetchCompanies(); }, []);

    const programMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
    const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

    // Derived metrics for summary cards
    const activeCount = useMemo(() => companies.filter((c) => {
        if (!c.cohort_id) return false;
        const prog = programMap.get(c.cohort_id);
        return prog?.status === 'active';
    }).length, [companies, programMap]);

    const totalMembers = useMemo(() => users.filter((u) => u.company_id && companies.some((c) => c.id === u.company_id)).length, [users, companies]);

    const columns = useMemo(() => [
        {
            header: 'Company',
            accessor: (company: Company) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg gradient-lime flex items-center justify-center shrink-0">
                        <span className="text-black font-bold text-sm">{company.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-white">{company.name}</span>
                </div>
            ),
        },
        { header: 'Industry', accessor: (company: Company) => company.industry || '—' },
        { header: 'Team Size', accessor: (company: Company) => company.team_size ?? '—' },
        {
            header: 'Program',
            accessor: (company: Company) => {
                const program = company.cohort_id ? programMap.get(company.cohort_id) : null;
                if (!program) return <span className="text-gray-500">Unassigned</span>;
                const badge: Record<string, string> = {
                    active: 'bg-lime/10 text-lime border-lime/30',
                    upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
                };
                return (
                    <div>
                        <span className="text-white text-sm">{program.name}</span>
                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded border ${badge[program.status]}`}>
                            {program.status}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Executive',
            accessor: (company: Company) => {
                const exec = company.executive_user_id ? userMap.get(company.executive_user_id) : null;
                return exec ? exec.full_name : <span className="text-gray-500">Unassigned</span>;
            }
        },
        {
            header: 'Enrolled',
            accessor: (company: Company) => formatDateLabel(company.enrollment_date) || '—'
        },
        {
            header: 'Workspace',
            accessor: (company: Company) => (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/companies/${company.id}`); }}
                    className="flex items-center gap-1 text-lime hover:text-lime/80 text-sm font-medium transition"
                >
                    Open <ExternalLink className="h-3.5 w-3.5" />
                </button>
            ),
        },
    ], [programMap, userMap, navigate]);

    const handleDelete = async (company: Company) => {
        if (!confirm(`Delete ${company.name}?`)) return;
        const { error: deleteError } = await supabase.from('companies').delete().eq('id', company.id);
        if (deleteError) { setError(deleteError.message); return; }
        fetchCompanies();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-gray-400 mt-1 text-sm">Manage partner companies and their masterclass workspaces</p>
                </div>
                <button
                    onClick={() => { setSelectedCompany(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl transition font-medium hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Add Company
                </button>
            </div>

            {/* Summary metric cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-lime/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{companies.length}</p>
                            <p className="text-xs text-gray-500">Total Companies</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-lime/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{activeCount}</p>
                            <p className="text-xs text-gray-500">Active Masterclasses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-lime/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{totalMembers}</p>
                            <p className="text-xs text-gray-500">Total Members</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={companies}
                columns={columns}
                isLoading={isLoading}
                onEdit={(company) => { setSelectedCompany(company); setIsModalOpen(true); }}
                onDelete={handleDelete}
            />

            <CompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                company={selectedCompany}
                programs={programs}
                users={users}
                onSuccess={() => { setIsModalOpen(false); setSelectedCompany(null); fetchCompanies(); }}
            />
        </div>
    );
}
