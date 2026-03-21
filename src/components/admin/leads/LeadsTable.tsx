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
    RowSelectionState,
} from '@tanstack/react-table';
import { Lead, LeadColumn } from '@/types/database';
import {
    ArrowUpDown,
    Pencil,
    Trash2,
    Search,
    Filter,
    ChevronDown,
    Settings2,
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
    { value: 'AI TALK', label: 'AI TALK' },
    { value: 'Advanced Workflows', label: 'Advanced Workflows' },
    { value: 'CRASH COURSE', label: 'CRASH COURSE' },
    { value: 'Full AI Integration', label: 'Full AI Integration' },
    { value: 'WORLD TOUR', label: 'WORLD TOUR' },
    { value: 'TBA', label: 'TBA' },
];

// Sticky column layout
// ┌──────────────┬─────────────────┬──────────────────────┬──────────────────────────────
// │  Checkbox    │    Priority     │       Name           │  Email (scrolls) …
// │  left:0      │  left:44px      │  left:204px          │
// │  w:44px      │  w:160px        │  w:220px             │
// └──────────────┴─────────────────┴──────────────────────┴──────────────────────────────
const STICKY_MAP: Record<string, { left: string; width: string }> = {
    select:    { left: 'left-0',       width: 'w-[44px]  min-w-[44px]  max-w-[44px]' },
    priority:  { left: 'left-[44px]',  width: 'w-[160px] min-w-[160px] max-w-[160px]' },
    full_name: { left: 'left-[204px]', width: 'w-[220px] min-w-[220px] max-w-[220px]' },
};

// Even/odd row backgrounds — must be opaque so scrolling content disappears cleanly behind sticky cols
const ROW_BG = ['bg-[#000000]', 'bg-[#050505]'] as const;

interface LeadsTableProps {
    data: Lead[];
    columnsConfig: LeadColumn[];
    onUpdateColumn: (colId: string, updates: Partial<LeadColumn>) => void;
    onDeleteColumn: (colId: string, colKey: string) => void;
    onOpenColumnSettings?: () => void;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onUpdatePriority: (leadId: string, priority: string) => void;
    onUpdateLead: (leadId: string, field: keyof Lead, value: any) => void;
    onBulkDelete?: (leadIds: string[]) => void;
    isUpdating?: string | null;
    highlightId?: string | null;
}

export function LeadsTable({
    data,
    columnsConfig,
    onUpdateColumn,
    onDeleteColumn,
    onOpenColumnSettings,
    onEdit,
    onDelete,
    onUpdatePriority,
    onUpdateLead,
    onBulkDelete,
    isUpdating,
    highlightId,
}: LeadsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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

    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [offeringFilter, setOfferingFilter] = useState<string>('ALL');

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
        } catch { /* ignore */ }
    }, [rowsPerPage]);

    // Inline editable column header (double-click to rename)
    const EditableHeader = ({ column, colConfig }: { column: any; colConfig: LeadColumn }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(colConfig.label);

        const handleSave = () => {
            if (value.trim() && value !== colConfig.label && onUpdateColumn) {
                onUpdateColumn(colConfig.id, { label: value });
            }
            setIsEditing(false);
        };

        return (
            <div
                className="flex items-center gap-1 hover:text-white transition-colors group relative"
                onDoubleClick={() => setIsEditing(true)}
            >
                {isEditing ? (
                    <input
                        autoFocus
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        className="bg-bg-elevated text-white px-1 py-0.5 rounded outline-none border border-lime/50 w-full min-w-[80px]"
                    />
                ) : (
                    <>
                        <button
                            className="flex items-center gap-1"
                            onClick={() => column.toggleSorting?.(column.getIsSorted() === 'asc')}
                        >
                            {colConfig.label}
                            {['full_name', 'company_name', 'payment_amount'].includes(colConfig.key) && (
                                <ArrowUpDown className="h-4 w-4" />
                            )}
                        </button>
                        {colConfig.is_custom && onDeleteColumn && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete custom column?')) {
                                        onDeleteColumn(colConfig.id, colConfig.key);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity ml-auto"
                                title="Delete Custom Column"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    const columns = useMemo<ColumnDef<Lead>[]>(() => {
        if (!columnsConfig || columnsConfig.length === 0) return [];

        // Checkbox / row-selection column — always first, always sticky
        const checkboxCol: ColumnDef<Lead> = {
            id: 'select',
            header: ({ table }) => {
                const allSelected = table.getIsAllPageRowsSelected();
                const someSelected = table.getIsSomePageRowsSelected();
                return (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] cursor-pointer accent-lime hover:ring-1 hover:ring-lime/50 transition-all"
                        title="Select all rows"
                    />
                );
            },
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] cursor-pointer accent-lime hover:ring-1 hover:ring-lime/50 transition-all"
                />
            ),
            // No meta width here — width is controlled entirely by STICKY_MAP
        };

        // Dynamic columns from lead_columns config
        // record_id is explicitly excluded — it must never render as a visible column
        // (also guarded in the DB by visible=false via migration 040, but we filter here too)
        const dynamicCols: ColumnDef<Lead>[] = columnsConfig
            .filter(c => c.visible && c.key !== 'record_id')
            .map(col => ({
                id: col.key,
                accessorFn: row => col.is_custom
                    ? row.custom_fields?.[col.key]
                    : (row as any)[col.key],
                header: ({ column }) => <EditableHeader column={column} colConfig={col} />,
                cell: ({ row }) => {
                    const val = col.is_custom
                        ? row.original.custom_fields?.[col.key]
                        : (row.original as any)[col.key];

                    const onUpdate = (newVal: any) => {
                        if (col.is_custom) {
                            const newFields = { ...row.original.custom_fields, [col.key]: newVal };
                            onUpdateLead(row.original.id, 'custom_fields' as any, newFields);
                        } else {
                            onUpdateLead(row.original.id, col.key as any, newVal);
                        }
                    };

                    const toText = (v: any) => (v === null || v === undefined) ? '' : String(v);

                    if (col.key === 'priority') {
                        const priority = (val as string) || 'COLD';
                        const colorConfig: Record<string, string> = {
                            'ACTIVE':       'bg-lime/10 text-lime border-lime/30',
                            'HOT':          'bg-red-500/20 text-red-300 border-red-500/30',
                            'COLD':         'bg-gray-500/20 text-gray-300 border-gray-500/30',
                            'LAVA':         'bg-orange-500/20 text-orange-300 border-orange-500/30',
                            'COMPLETED':    'bg-green-500/20 text-green-300 border-green-500/30',
                            'NOT INTERESTED': 'bg-gray-700/20 text-gray-400 border-border/30',
                        };
                        return (
                            <EditableSelectCell
                                value={priority}
                                options={PRIORITY_OPTIONS}
                                onUpdate={(newVal) => onUpdatePriority(row.original.id, newVal)}
                                className={`text-xs font-medium border px-2 py-1 rounded-md w-fit ${colorConfig[priority] || colorConfig['COLD']}`}
                            />
                        );
                    }

                    if (col.key === 'offering_type') {
                        return (
                            <EditableSelectCell
                                value={toText(val) || 'TBA'}
                                options={OFFERING_OPTIONS}
                                onUpdate={onUpdate}
                                className="text-sm text-gray-300"
                            />
                        );
                    }

                    if (['has_coupon', 'paid_full', 'is_payment_plan', 'paid_deposit'].includes(col.key)) {
                        return (
                            <EditableSelectCell
                                value={val === true || val === 'true' ? 'true' : 'false'}
                                options={BOOLEAN_OPTIONS}
                                onUpdate={(newVal) => onUpdate(newVal === 'true')}
                            />
                        );
                    }

                    if (col.key === 'coupon_percent') {
                        return <EditableMoneyCell value={val as number | undefined} onUpdate={onUpdate} format="percentage" />;
                    }

                    if (col.key === 'seats' || col.key === 'sessions_done') {
                        return <EditableMoneyCell value={val as number | undefined} onUpdate={onUpdate} format="number" />;
                    }

                    if (col.type === 'date') {
                        return <EditableDateCell value={val as string} onUpdate={onUpdate} />;
                    }

                    if (col.type === 'number') {
                        return <EditableMoneyCell value={val ?? undefined} onUpdate={onUpdate} format="currency" />;
                    }

                    return (
                        <EditableTextCell
                            value={toText(val)}
                            onUpdate={onUpdate}
                            multiline={col.key === 'notes' || col.key === 'description'}
                            className={
                                col.key === 'full_name'    ? 'font-medium' :
                                col.key === 'company_name' ? 'text-gray-300' :
                                col.key === 'email'        ? 'text-sm text-gray-400' :
                                col.key === 'description'  ? 'truncate max-w-[200px]' :
                                col.key === 'notes'        ? 'truncate max-w-[200px]' : ''
                            }
                        />
                    );
                },
                meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' },
            }));

        const systemCols: ColumnDef<Lead>[] = [
            {
                accessorKey: 'owner_id',
                header: 'Owner ID',
                cell: ({ row }) => (
                    <span className="text-xs text-gray-500">
                        {row.getValue('owner_id') ? String(row.getValue('owner_id')) : '-'}
                    </span>
                ),
                meta: { headerClassName: 'min-w-[220px]', cellClassName: 'min-w-[220px]' },
            },
            {
                accessorKey: 'priority_changed_at',
                header: 'Priority Changed',
                cell: ({ row }) => {
                    const date = row.getValue('priority_changed_at') as string;
                    return (
                        <span className="text-xs text-gray-500">
                            {date ? new Date(date).toLocaleDateString() : '-'}
                        </span>
                    );
                },
                meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const lead = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => onUpdateLead?.(lead.id, 'is_highlighted', !lead.is_highlighted)}
                                className="p-2 hover:bg-lime/10 rounded-lg text-gray-400 hover:text-lime transition-colors"
                                title={lead.is_highlighted ? 'Remove Highlight' : 'Highlight Row'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                                    <path d="m5 2 5 5" /><path d="M2 13h15" />
                                    <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
                                </svg>
                            </button>
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
                meta: { headerClassName: 'min-w-[120px] text-right', cellClassName: 'min-w-[120px]' },
            },
        ];

        return [checkboxCol, ...dynamicCols, ...systemCols];
    }, [columnsConfig, onUpdateColumn, onDeleteColumn, onUpdateLead, onUpdatePriority, onEdit, onDelete]);

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
        onRowSelectionChange: setRowSelection,
        getRowId: (row) => row.id,
        enableRowSelection: true,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
    });

    const allProcessedRows = table.getRowModel().rows;
    const visibleRows = useMemo(() => {
        if (rowsPerPage === 'all') return allProcessedRows;
        return allProcessedRows.slice(0, rowsPerPage);
    }, [allProcessedRows, rowsPerPage]);

    const totalFilteredRows = table.getFilteredRowModel().rows.length;
    const visibleCount = visibleRows.length;

    // ── Sticky column helpers ─────────────────────────────────────────────────
    // z-40 on sticky headers (above the z-20 thead and z-10 sticky body cells).
    // Fully opaque backgrounds prevent scrolling content from bleeding through.
    const getStickyHeaderClass = (colId: string) => {
        const s = STICKY_MAP[colId];
        if (!s) return '';
        return `sticky ${s.left} z-40 ${s.width} bg-bg-elevated border-r border-border`;
    };

    const getStickyCellClass = (colId: string, rowIndex: number) => {
        const s = STICKY_MAP[colId];
        if (!s) return '';
        const bg = ROW_BG[rowIndex % 2];
        return `sticky ${s.left} z-20 ${s.width} ${bg} border-r border-border`;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-4 shadow-sm hover:border-white/[0.12] transition-colors">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[260px]">
                        <div className="relative group/search">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within/search:text-lime transition-colors" />
                            <input
                                type="text"
                                placeholder="Search all columns..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-lime/30 focus:ring-1 focus:ring-lime/10 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="min-w-[180px] relative">
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60"
                        >
                            <option value="ALL">All Priorities</option>
                            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>

                    {/* Offering Filter */}
                    <div className="min-w-[180px] relative">
                        <select
                            value={offeringFilter}
                            onChange={(e) => setOfferingFilter(e.target.value)}
                            className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60"
                        >
                            <option value="ALL">All Offerings</option>
                            {OFFERING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>

                    {/* Bulk Actions Menu */}
                    {Object.keys(rowSelection).length > 0 && onBulkDelete && (
                        <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-sm font-medium text-white px-2 bg-white/[0.05] rounded-lg py-1">
                                {Object.keys(rowSelection).length} selected
                            </span>
                            <button
                                onClick={() => {
                                    if (confirm(`Delete ${Object.keys(rowSelection).length} leads? This cannot be undone.`)) {
                                        onBulkDelete(Object.keys(rowSelection));
                                        setRowSelection({});
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    )}

                    {/* Rows per page */}
                    <div className="min-w-[140px] relative">
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                const v = e.target.value;
                                setRowsPerPage(v === 'all' ? 'all' : (Number(v) as RowsPerPage));
                            }}
                            className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60"
                        >
                            {ROWS_PER_PAGE_OPTIONS.map(o => (
                                <option key={o} value={o}>{o === 'all' ? 'All rows' : `${o} rows`}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>

                    {/* Density toggle */}
                    <button
                        onClick={() => setDenseMode(p => !p)}
                        className={`px-4 py-2 rounded-xl border text-sm transition-colors font-medium ${denseMode ? 'border-lime/30 text-lime bg-lime/5' : 'border-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
                    >
                        {denseMode ? 'Compact rows' : 'Comfort rows'}
                    </button>

                    {/* Column Settings */}
                    <button
                        onClick={onOpenColumnSettings}
                        className="px-4 py-2 rounded-xl border border-white/[0.05] text-gray-300 hover:text-white hover:bg-white/[0.03] text-sm transition-colors flex items-center gap-2 font-medium"
                        title="Manage columns — add, hide, reorder, delete"
                    >
                        <Settings2 className="h-4 w-4" />
                        <span>Columns</span>
                    </button>
                </div>

                {/* Active Filters Summary */}
                {(priorityFilter !== 'ALL' || offeringFilter !== 'ALL' || globalFilter) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Active filters:</span>
                        {globalFilter && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
                                Search: &quot;{globalFilter}&quot;
                            </span>
                        )}
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
                            onClick={() => { setPriorityFilter('ALL'); setOfferingFilter('ALL'); setGlobalFilter(''); }}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                    Showing {visibleCount} of {totalFilteredRows} leads
                    {Object.keys(rowSelection).length > 0 && (
                        <span className="ml-3 text-lime">
                            · {Object.keys(rowSelection).length} selected
                        </span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className={`w-full max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] shadow-sm hover:border-white/[0.12] transition-colors ${isUpdating ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="w-full max-w-full max-h-[60vh] overflow-auto">
                    <table className={`min-w-[3200px] w-max border-separate border-spacing-0 ${denseMode ? 'text-xs' : 'text-sm'}`}>

                        {/* ── thead: sticky top + solid background ─────────────── */}
                        <thead className="sticky top-0 z-30 bg-[#0a0a0a]">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const isSelect = header.column.id === 'select';
                                        const meta = header.column.columnDef.meta as { headerClassName?: string } | undefined;
                                        const stickyClass = getStickyHeaderClass(header.column.id).replace('bg-bg-elevated', 'bg-[#0a0a0a]').replace('border-border', 'border-white/[0.05]');
                                        return (
                                            <th
                                                key={header.id}
                                                className={[
                                                    // Padding: tighter for the checkbox col
                                                    isSelect ? 'px-3 py-3' : 'px-4 py-3',
                                                    'text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 border-b border-white/[0.08]',
                                                    meta?.headerClassName || '',
                                                    stickyClass,
                                                ].join(' ')}
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>

                        {/* ── tbody ─────────────────────────────────────────────── */}
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
                                    const baseBg = ROW_BG[rowIndex % 2];
                                    const isHighlighted = highlightId === row.original.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            id={`lead-row-${row.original.id}`}
                                            data-state={row.getIsSelected() ? 'selected' : undefined}
                                            className={`${baseBg} hover:bg-white/5 transition-colors`}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const isSelect = cell.column.id === 'select';
                                                const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                                                const stickyClass = getStickyCellClass(cell.column.id, rowIndex);
                                                return (
                                                    <td
                                                        key={cell.id}
                                                        className={[
                                                            'whitespace-nowrap border-b border-white/[0.05]',
                                                            isSelect ? 'px-3' : 'px-4',
                                                            denseMode ? 'py-2' : 'py-3',
                                                            'text-gray-200',
                                                            meta?.cellClassName || '',
                                                            stickyClass.replace('border-border', 'border-white/[0.02]'),
                                                            isHighlighted ? 'bg-lime/5' : '',
                                                            // Lime left-border only on the first sticky col (checkbox) for highlighted rows
                                                            isHighlighted && isSelect ? 'border-l-2 border-l-lime/50' : '',
                                                        ].filter(Boolean).join(' ')}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
