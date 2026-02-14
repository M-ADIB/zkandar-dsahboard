import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { AddCompanyModal } from '@/components/admin/company/AddCompanyModal';
import { Plus } from 'lucide-react';
import type { Company } from '@/types/database';

export function CompaniesPage() {
    const supabase = useSupabase();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchCompanies = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching companies:', error);
        } else {
            setCompanies(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const columns = [
        { header: 'Company Name', accessor: 'name' as keyof Company, className: 'font-medium text-white' },
        { header: 'Industry', accessor: 'industry' as keyof Company },
        { header: 'Team Size', accessor: 'team_size' as keyof Company },
        {
            header: 'Enrollment Date',
            accessor: (company: Company) => new Date(company.enrollment_date).toLocaleDateString()
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-gray-400 mt-1">Manage partner companies and their details</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Company
                </button>
            </div>

            <AdminTable
                data={companies}
                columns={columns}
                isLoading={isLoading}
                onEdit={(company) => console.log('Edit', company)}
                onDelete={(company) => console.log('Delete', company)}
            />

            <AddCompanyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    fetchCompanies();
                }}
            />
        </div>
    );
}
