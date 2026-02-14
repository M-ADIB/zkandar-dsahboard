import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
} from '@tanstack/react-table';
import { Lead } from '@/types/database';
import {
    ArrowUpDown,
    Pencil,
    Trash2,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { EditableTextCell } from './cells/EditableTextCell';
import { EditableSelectCell } from './cells/EditableSelectCell';
import { EditableMoneyCell } from './cells/EditableMoneyCell';
import { EditableDateCell } from './cells/EditableDateCell';

const PRIORITY_OPTIONS = [
    { value: 'ACTIVE', label: 'ACTIVE', color: 'blue' },
    { value: 'HOT', label: 'HOT', color: 'red' },
    { value: 'COLD', label: 'COLD', color: 'gray' },
    { value: 'LAVA', label: 'LAVA', color: 'orange' },
    { value: 'COMPLETED', label: 'COMPLETED', color: 'green' },
    { value: 'NOT INTERESTED', label: 'NOT INTERESTED', color: 'gray' },
];

const OFFERING_OPTIONS = [
    { value: 'Sprint Workshop', label: 'Sprint Workshop' },
    { value: '5-Week Masterclass', label: '5-Week Masterclass' },
    { value: 'Data Analytics', label: 'Data Analytics' },
    { value: 'TBA', label: 'TBA' },
];

interface LeadsTableProps {
    data: Lead[];
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onUpdatePriority: (leadId: string, priority: string) => void;
    onUpdateLead: (leadId: string, field: keyof Lead, value: any) => void;
    isUpdating?: string | null;
}

export function LeadsTable({
    data,
    onEdit,
    onDelete,
    onUpdatePriority,
    onUpdateLead,
    isUpdating
}: LeadsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // Custom Filters State (mapped to column filters)
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [offeringFilter, setOfferingFilter] = useState<string>('ALL');

    // Update column filters when custom filters change
    useMemo(() => {
        const filters = [];
        if (priorityFilter !== 'ALL') filters.push({ id: 'priority', value: priorityFilter });
        if (offeringFilter !== 'ALL') filters.push({ id: 'offering_type', value: offeringFilter });
        setColumnFilters(filters);
    }, [priorityFilter, offeringFilter]);

    const columns = useMemo<ColumnDef<Lead>[]>(() => [
        {
            accessorKey: 'full_name',
            header: ({ column }) => {
                return (
                    <button
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                )
            },
            cell: ({ row }) => (
                <EditableTextCell
                    value={row.getValue('full_name')}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'full_name', val)}
                    className="font-medium"
                />
            ),
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const priority = (row.getValue('priority') as string) || 'COLD';
                const colorConfig: Record<string, string> = {
                    'ACTIVE': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    'HOT': 'bg-red-500/20 text-red-400 border-red-500/30',
                    'COLD': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                    'LAVA': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                    'COMPLETED': 'bg-green-500/20 text-green-400 border-green-500/30',
                    'NOT INTERESTED': 'bg-gray-700/20 text-gray-500 border-gray-700/30',
                };

                return (
                    <EditableSelectCell
                        value={priority}
                        options={PRIORITY_OPTIONS}
                        onUpdate={(val) => onUpdatePriority(row.original.id, val)}
                        className={`text-xs font-medium border px-2 py-1 rounded-md w-fit ${colorConfig[priority] || colorConfig['COLD']}`}
                    />
                );
            },
        },
        {
            accessorKey: 'company_name',
            header: ({ column }) => {
                return (
                    <button
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Company
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                )
            },
            cell: ({ row }) => (
                <EditableTextCell
                    value={row.getValue('company_name')}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'company_name', val)}
                    className="text-gray-300"
                />
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <EditableTextCell
                    value={row.getValue('email')}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'email', val)}
                    className="text-sm text-gray-400"
                />
            ),
        },
        {
            accessorKey: 'offering_type',
            header: 'Offering',
            cell: ({ row }) => (
                <EditableSelectCell
                    value={row.getValue('offering_type') || 'TBA'}
                    options={OFFERING_OPTIONS}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'offering_type', val)}
                    className="text-sm text-gray-300"
                />
            ),
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string;
                if (!value || value === 'ALL') return true;
                return rowValue?.includes(value);
            }
        },
        {
            id: 'payment_amount',
            accessorFn: row => row.payment_amount,
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Payment
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            ),
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.payment_amount ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'payment_amount', val)}
                />
            ),
        },
        {
            accessorKey: 'discovery_call_date',
            header: 'Discovery Call',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('discovery_call_date') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'discovery_call_date', val)}
                />
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => onEdit(lead)}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(lead)}
                            className="p-2 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                );
            },
        },
    ], [onEdit, onDelete, onUpdatePriority, isUpdating]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search all columns..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-dashboard-accent"
                            />
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="min-w-[200px]">
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                        >
                            <option value="ALL">All Priorities</option>
                            {PRIORITY_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Offering Filter */}
                    <div className="min-w-[200px]">
                        <select
                            value={offeringFilter}
                            onChange={(e) => setOfferingFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                        >
                            <option value="ALL">All Offerings</option>
                            {OFFERING_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(priorityFilter !== 'ALL' || offeringFilter !== 'ALL' || globalFilter) && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Active filters:</span>
                        {priorityFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-dashboard-accent/20 text-dashboard-accent rounded">
                                Priority: {priorityFilter}
                            </span>
                        )}
                        {offeringFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-dashboard-accent/20 text-dashboard-accent rounded">
                                Offering: {offeringFilter}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setPriorityFilter('ALL');
                                setOfferingFilter('ALL');
                                setGlobalFilter('');
                            }}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-800">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1A1F2E]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-[#0F1219]">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-[#1A1F2E] transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="h-24 text-center text-gray-400"
                                >
                                    No results.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-gray-400">
                    {table.getFilteredRowModel().rows.length} row(s)
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-400">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            className="p-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 text-gray-300"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            className="p-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 text-gray-300"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            className="p-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 text-gray-300"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            className="p-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 text-gray-300"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
