import { Wrench } from 'lucide-react';
import { AdminToolboxTab } from '@/components/admin/programs/AdminToolboxTab';

export function AdminToolboxPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-lime" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Toolbox</h1>
                    <p className="text-gray-400 text-sm">Manage AI tools and resources for program participants</p>
                </div>
            </div>

            <AdminToolboxTab />
        </div>
    );
}
