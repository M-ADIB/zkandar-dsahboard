import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { CompanyModal } from '@/components/admin/company/CompanyModal';
import { Plus } from 'lucide-react';
import { formatDateLabel } from '@/lib/time';
import type { Cohort, Company, User } from '@/types/database';

export function CompaniesPage() {
    const supabase = useSupabase();
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

        if (usersResult.error) {
            setError(usersResult.error.message);
            setUsers([]);
        } else {
            setUsers((usersResult.data as User[]) ?? []);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const programMap = useMemo(() => {
        return new Map(programs.map((program) => [program.id, program]));
    }, [programs]);

    const userMap = useMemo(() => {
        return new Map(users.map((user) => [user.id, user]));
    }, [users]);

    const columns = useMemo(() => [
        { header: 'Company Name', accessor: 'name' as keyof Company, className: 'font-medium text-white' },
        { header: 'Industry', accessor: (company: Company) => company.industry || '—' },
        { header: 'Team Size', accessor: (company: Company) => company.team_size ?? '—' },
        {
            header: 'Program',
            accessor: (company: Company) => {
                const program = company.cohort_id ? programMap.get(company.cohort_id) : null;
                return program ? program.name : 'Unassigned';
            }
        },
        {
            header: 'Executive',
            accessor: (company: Company) => {
                const executive = company.executive_user_id ? userMap.get(company.executive_user_id) : null;
                return executive ? executive.full_name : 'Unassigned';
            }
        },
        {
            header: 'Enrollment Date',
            accessor: (company: Company) => formatDateLabel(company.enrollment_date) || '—'
        },
    ], [programMap, userMap]);

    const handleDelete = async (company: Company) => {
        if (!confirm(`Delete ${company.name}?`)) return;

        const { error: deleteError } = await supabase
            .from('companies')
            .delete()
            .eq('id', company.id);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }

        fetchCompanies();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-gray-400 mt-1">Manage partner companies and their details</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedCompany(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Company
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={companies}
                columns={columns}
                isLoading={isLoading}
                onEdit={(company) => {
                    setSelectedCompany(company);
                    setIsModalOpen(true);
                }}
                onDelete={handleDelete}
            />

            <CompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                company={selectedCompany}
                programs={programs}
                users={users}
                onSuccess={() => {
                    setIsModalOpen(false);
                    setSelectedCompany(null);
                    fetchCompanies();
                }}
            />
        </div>
    );
}
