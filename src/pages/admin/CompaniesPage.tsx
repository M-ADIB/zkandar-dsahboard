import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/hooks/useSupabase';
import { MetricCard } from '@/components/shared/MetricCard';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { CompanyModal } from '@/components/admin/company/CompanyModal';
import { Plus, Users, GraduationCap, MapPin } from 'lucide-react';
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

    const activeCount = useMemo(() => companies.filter((c) => {
        if (!c.cohort_id) return false;
        const prog = programMap.get(c.cohort_id);
        return prog?.status === 'active';
    }).length, [companies, programMap]);

    const activeLocationsCount = useMemo(() => {
        const activeCountries = new Set<string>();
        companies.forEach(c => {
            if (c.country && c.cohort_id) {
                const prog = programMap.get(c.cohort_id);
                if (prog?.status === 'active') {
                    activeCountries.add(c.country);
                }
            }
        });
        return activeCountries.size;
    }, [companies, programMap]);

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
    ], [programMap, userMap]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard 
                    icon={GraduationCap} 
                    label="Active Masterclasses" 
                    value={activeCount} 
                    limeAccent 
                    delay={0}
                />
                <MetricCard 
                    icon={MapPin} 
                    label="Number of Locations" 
                    value={activeLocationsCount} 
                    delay={0.1}
                />
                <MetricCard 
                    icon={Users} 
                    label="Total Members" 
                    value={totalMembers} 
                    delay={0.2}
                />
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
                onRowClick={(company) => navigate(`/admin/companies/${company.id}`)}
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
