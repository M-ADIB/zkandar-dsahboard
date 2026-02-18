import { useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
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
    ChevronDown
} from 'lucide-react';
import { EditableTextCell } from './cells/EditableTextCell';
import { EditableSelectCell } from './cells/EditableSelectCell';
import { EditableMoneyCell } from './cells/EditableMoneyCell';
import { EditableDateCell } from './cells/EditableDateCell';

const PRIORITY_OPTIONS = [
    { value: 'ACTIVE', label: 'ACTIVE', color: 'lime' },
    { value: 'HOT', label: 'HOT', color: 'red' },
    { value: 'LAVA', label: 'LAVA', color: 'orange' },
    { value: 'COLD', label: 'COLD', color: 'gray' },
    { value: 'COMPLETED', label: 'COMPLETED', color: 'green' },
    { value: 'NOT INTERESTED', label: 'NOT INTERESTED', color: 'gray' },
];

const BOOLEAN_OPTIONS = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
];

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200, 'all'] as const;
type RowsPerPage = typeof ROWS_PER_PAGE_OPTIONS[number];
const ROWS_PER_PAGE_STORAGE_KEY = 'leads.rowsPerPage';

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
    const [denseMode, setDenseMode] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPage>(() => {
        if (typeof window === 'undefined') return 100;
        try {
            const stored = localStorage.getItem(ROWS_PER_PAGE_STORAGE_KEY);
            if (stored === 'all') return 'all';
            const numeric = stored ? Number(stored) : NaN;
            return Number.isFinite(numeric) ? (numeric as RowsPerPage) : 100;
        } catch {
            return 100;
        }
    });

    // Custom Filters State (mapped to column filters)
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [offeringFilter, setOfferingFilter] = useState<string>('ALL');

    // Update column filters when custom filters change
    useEffect(() => {
        const filters = [];
        if (priorityFilter !== 'ALL') filters.push({ id: 'priority', value: priorityFilter });
        if (offeringFilter !== 'ALL') filters.push({ id: 'offering_type', value: offeringFilter });
        setColumnFilters(filters);
    }, [priorityFilter, offeringFilter]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(ROWS_PER_PAGE_STORAGE_KEY, String(rowsPerPage));
        } catch {
            // Ignore storage errors (private mode, disabled storage)
        }
    }, [rowsPerPage]);

    const toText = (value: unknown) => {
        if (value === null || value === undefined) return '';
        return String(value);
    };

    const toNumber = (value: string) => {
        if (value.trim() === '') return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const normalizeBoolean = (value: unknown) => {
        return value === true || value === 'true' ? 'true' : 'false';
    };

    const formatDateLabel = (value: string | null | undefined) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
    };

    const columns = useMemo<ColumnDef<Lead>[]>(() => [
        {
            accessorKey: 'full_name',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Name
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('full_name'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'full_name', val)}
                    className="font-medium"
                />
            ),
            meta: { headerClassName: 'min-w-[220px] max-w-[220px]', cellClassName: 'min-w-[220px] max-w-[220px]' }
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const priority = (row.getValue('priority') as string) || 'COLD';
                const colorConfig: Record<string, string> = {
                    'ACTIVE': 'bg-lime/10 text-lime border-lime/30',
                    'HOT': 'bg-red-500/20 text-red-300 border-red-500/30',
                    'COLD': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                    'LAVA': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                    'COMPLETED': 'bg-green-500/20 text-green-300 border-green-500/30',
                    'NOT INTERESTED': 'bg-gray-700/20 text-gray-400 border-gray-700/30',
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
            meta: { headerClassName: 'min-w-[160px] max-w-[160px]', cellClassName: 'min-w-[160px] max-w-[160px]' }
        },
        {
            accessorKey: 'company_name',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Company
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('company_name'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'company_name', val)}
                    className="text-gray-300"
                />
            ),
            meta: { headerClassName: 'min-w-[200px]', cellClassName: 'min-w-[200px]' }
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('email'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'email', val)}
                    className="text-sm text-gray-400"
                />
            ),
            meta: { headerClassName: 'min-w-[240px]', cellClassName: 'min-w-[240px]' }
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('phone'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'phone', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
        },
        {
            accessorKey: 'instagram',
            header: 'Instagram',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('instagram'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'instagram', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
        },
        {
            accessorKey: 'job_title',
            header: 'Job Title',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('job_title'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'job_title', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[200px]', cellClassName: 'min-w-[200px]' }
        },
        {
            accessorKey: 'country',
            header: 'Country',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('country'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'country', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'city',
            header: 'City',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('city'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'city', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('description'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'description', val)}
                    className="truncate"
                />
            ),
            meta: { headerClassName: 'min-w-[240px]', cellClassName: 'min-w-[240px]' }
        },
        {
            accessorKey: 'offering_type',
            header: 'Offering',
            cell: ({ row }) => (
                <EditableSelectCell
                    value={toText(row.getValue('offering_type')) || 'TBA'}
                    options={OFFERING_OPTIONS}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'offering_type', val)}
                    className="text-sm text-gray-300"
                />
            ),
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string;
                if (!value || value === 'ALL') return true;
                return rowValue?.includes(value);
            },
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
        },
        {
            accessorKey: 'session_type',
            header: 'Session Type',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('session_type'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'session_type', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
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
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
        },
        {
            id: 'payment_amount',
            accessorFn: row => row.payment_amount,
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Payment (AED)
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            ),
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.payment_amount ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'payment_amount', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'seats',
            header: 'Seats',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('seats'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'seats', toNumber(val))}
                />
            ),
            meta: { headerClassName: 'min-w-[100px]', cellClassName: 'min-w-[100px]' }
        },
        {
            accessorKey: 'balance',
            header: 'Balance (AED)',
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.balance ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'balance', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'balance_2',
            header: 'Balance 2 (AED)',
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.balance_2 ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'balance_2', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'coupon_percent',
            header: 'Coupon %',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('coupon_percent'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'coupon_percent', toNumber(val))}
                />
            ),
            meta: { headerClassName: 'min-w-[120px]', cellClassName: 'min-w-[120px]' }
        },
        {
            accessorKey: 'coupon_code',
            header: 'Coupon Code',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('coupon_code'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'coupon_code', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'paid_deposit',
            header: 'Paid Deposit',
            cell: ({ row }) => (
                <EditableSelectCell
                    value={normalizeBoolean(row.getValue('paid_deposit'))}
                    options={BOOLEAN_OPTIONS}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'paid_deposit', val === 'true')}
                    className="text-xs"
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'paid_full',
            header: 'Paid Full',
            cell: ({ row }) => (
                <EditableSelectCell
                    value={normalizeBoolean(row.getValue('paid_full'))}
                    options={BOOLEAN_OPTIONS}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'paid_full', val === 'true')}
                    className="text-xs"
                />
            ),
            meta: { headerClassName: 'min-w-[120px]', cellClassName: 'min-w-[120px]' }
        },
        {
            accessorKey: 'amount_paid',
            header: 'Amount Paid (AED)',
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.amount_paid ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'amount_paid', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'amount_paid_2',
            header: 'Amount Paid 2 (AED)',
            cell: ({ row }) => (
                <EditableMoneyCell
                    value={row.original.amount_paid_2 ?? undefined}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'amount_paid_2', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[150px]', cellClassName: 'min-w-[150px]' }
        },
        {
            accessorKey: 'date_of_payment',
            header: 'DOP 1',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('date_of_payment') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'date_of_payment', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'date_of_payment_2',
            header: 'DOP 2',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('date_of_payment_2') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'date_of_payment_2', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'date_of_payment_3',
            header: 'DOP 3',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('date_of_payment_3') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'date_of_payment_3', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'payment_plan',
            header: 'Payment Plan',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('payment_plan'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'payment_plan', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'balance_dop',
            header: 'Balance DOP',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('balance_dop') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'balance_dop', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'day_slot',
            header: 'Day Slot',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('day_slot'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'day_slot', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'time_slot',
            header: 'Time Slot',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('time_slot'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'time_slot', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'start_date',
            header: 'Start Date',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('start_date') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'start_date', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'end_date',
            header: 'End Date',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('end_date') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'end_date', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'sessions_done',
            header: 'Sessions Done',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('sessions_done'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'sessions_done', toNumber(val))}
                />
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'booked_support',
            header: 'Booked Support',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('booked_support'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'booked_support', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'support_date_booked',
            header: 'Support Date',
            cell: ({ row }) => (
                <EditableDateCell
                    value={row.getValue('support_date_booked') as string}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'support_date_booked', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'notes',
            header: 'Notes',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('notes'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'notes', val)}
                    className="truncate"
                />
            ),
            meta: { headerClassName: 'min-w-[240px]', cellClassName: 'min-w-[240px]' }
        },
        {
            accessorKey: 'record_id',
            header: 'Record ID',
            cell: ({ row }) => (
                <EditableTextCell
                    value={toText(row.getValue('record_id'))}
                    onUpdate={(val) => onUpdateLead(row.original.id, 'record_id', val)}
                />
            ),
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
        },
        {
            accessorKey: 'owner_id',
            header: 'Owner ID',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">{toText(row.getValue('owner_id')) || '-'}</span>
            ),
            meta: { headerClassName: 'min-w-[220px]', cellClassName: 'min-w-[220px]' }
        },
        {
            accessorKey: 'priority_changed_at',
            header: 'Priority Changed',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">{formatDateLabel(row.getValue('priority_changed_at') as string)}</span>
            ),
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
        },
        {
            accessorKey: 'priority_previous_values',
            header: 'Priority History',
            cell: ({ row }) => {
                const values = row.original.priority_previous_values as unknown;
                let label = '-';

                if (Array.isArray(values)) {
                    label = values.filter(Boolean).join(', ') || '-';
                } else if (typeof values === 'string') {
                    const trimmed = values.trim();
                    if (trimmed) {
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            const inner = trimmed.slice(1, -1);
                            label = inner ? inner.split(',').filter(Boolean).join(', ') : '-';
                        } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                label = Array.isArray(parsed)
                                    ? parsed.filter(Boolean).join(', ') || '-'
                                    : trimmed;
                            } catch {
                                label = trimmed;
                            }
                        } else {
                            label = trimmed;
                        }
                    }
                } else if (values && typeof values === 'object') {
                    const list = Object.values(values as Record<string, string>).filter(Boolean);
                    label = list.length > 0 ? list.join(', ') : '-';
                }

                return (
                    <span className="text-xs text-gray-500">
                        {label}
                    </span>
                );
            },
            meta: { headerClassName: 'min-w-[200px]', cellClassName: 'min-w-[200px]' }
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">{formatDateLabel(row.getValue('created_at') as string)}</span>
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">{formatDateLabel(row.getValue('updated_at') as string)}</span>
            ),
            meta: { headerClassName: 'min-w-[140px]', cellClassName: 'min-w-[140px]' }
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => onEdit(lead)}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
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
            meta: { headerClassName: 'min-w-[120px] text-right', cellClassName: 'min-w-[120px]' }
        },
    ], [onEdit, onDelete, onUpdatePriority, onUpdateLead]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
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

    const sortedRows = table.getSortedRowModel().rows;
    const visibleRows = useMemo(() => {
        if (rowsPerPage === 'all') return sortedRows;
        return sortedRows.slice(0, rowsPerPage);
    }, [sortedRows, rowsPerPage]);

    const totalFilteredRows = table.getFilteredRowModel().rows.length;
    const visibleCount = visibleRows.length;

    const stickyColumns: Record<string, { left: string; width: string }> = {
        full_name: { left: 'left-0', width: 'w-[220px] min-w-[220px] max-w-[220px]' },
        priority: { left: 'left-[220px]', width: 'w-[160px] min-w-[160px] max-w-[160px]' },
    };

    const getStickyHeaderClass = (columnId: string) => {
        const sticky = stickyColumns[columnId];
        if (!sticky) return '';
        return `sticky ${sticky.left} z-30 ${sticky.width} bg-bg-elevated border-r border-border`;
    };

    const getStickyCellClass = (columnId: string, rowIndex: number) => {
        const sticky = stickyColumns[columnId];
        if (!sticky) return '';
        const rowTone = rowIndex % 2 === 0 ? 'bg-bg-primary/80' : 'bg-bg-card/80';
        return `sticky ${sticky.left} z-10 ${sticky.width} ${rowTone} border-r border-border`;
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="rounded-xl border border-border bg-bg-card/60 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[260px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search all columns..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500/60 focus:ring-1 focus:ring-white/5"
                            />
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="min-w-[180px]">
                        <div className="relative">
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60 focus:ring-1 focus:ring-white/5"
                            >
                                <option value="ALL">All Priorities</option>
                                {PRIORITY_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                    </div>

                    {/* Offering Filter */}
                    <div className="min-w-[180px]">
                        <div className="relative">
                            <select
                                value={offeringFilter}
                                onChange={(e) => setOfferingFilter(e.target.value)}
                                className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60 focus:ring-1 focus:ring-white/5"
                            >
                                <option value="ALL">All Offerings</option>
                                {OFFERING_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                    </div>

                    {/* Rows per page */}
                    <div className="min-w-[140px]">
                        <div className="relative">
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setRowsPerPage(val === 'all' ? 'all' : (Number(val) as RowsPerPage));
                                }}
                                className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60 focus:ring-1 focus:ring-white/5"
                            >
                                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option === 'all' ? 'All rows' : `${option} rows`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                    </div>

                    {/* Density toggle */}
                    <button
                        onClick={() => setDenseMode((prev) => !prev)}
                        className={`px-4 py-2 rounded-xl border text-sm transition-colors ${denseMode
                            ? 'border-gray-500/60 text-gray-100 bg-white/5'
                            : 'border-border text-gray-400 hover:text-white hover:border-gray-500/60'
                            }`}
                    >
                        {denseMode ? 'Compact rows' : 'Comfort rows'}
                    </button>
                </div>

                {/* Active Filters Summary */}
                {(priorityFilter !== 'ALL' || offeringFilter !== 'ALL' || globalFilter) && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Active filters:</span>
                        {priorityFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
                                Priority: {priorityFilter}
                            </span>
                        )}
                        {offeringFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
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

                <div className="mt-3 text-xs text-gray-500">
                    Showing {visibleCount} of {totalFilteredRows} leads
                </div>
            </div>

            {/* Table */}
            <div className={`w-full max-w-full overflow-hidden rounded-xl border border-border bg-bg-card/80 ${isUpdating ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="w-full max-w-full max-h-[60vh] overflow-auto">
                    <table className={`min-w-[3200px] w-max border-separate border-spacing-0 ${denseMode ? 'text-xs' : 'text-sm'}`}>
                        <thead className="sticky top-0 z-20 bg-bg-elevated">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const meta = header.column.columnDef.meta as { headerClassName?: string } | undefined;
                                        return (
                                            <th
                                                key={header.id}
                                                className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-border ${meta?.headerClassName || ''} ${getStickyHeaderClass(header.column.id)}`}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {visibleRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={table.getVisibleLeafColumns().length}
                                        className="h-24 text-center text-gray-500"
                                    >
                                        No results.
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map((row, rowIndex) => {
                                    const rowTone = rowIndex % 2 === 0 ? 'bg-bg-primary/60' : 'bg-bg-card/60';
                                    return (
                                        <tr
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={`${rowTone} hover:bg-white/5 transition-colors`}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                                                const stickyClass = getStickyCellClass(cell.column.id, rowIndex);
                                                return (
                                                    <td
                                                        key={cell.id}
                                                        className={`whitespace-nowrap border-b border-border px-4 ${denseMode ? 'py-2' : 'py-3'} text-gray-200 ${meta?.cellClassName || ''} ${stickyClass}`}
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
