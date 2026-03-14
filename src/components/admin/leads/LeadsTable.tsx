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
    isUpdating,
    highlightId
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




    const EditableHeader = ({ column, colConfig }: { column: any, colConfig: LeadColumn }) => {
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
        if (!columnsConfig || columnsConfig.length === 0) return []; // Fallback while loading

        const dynamicCols: ColumnDef<Lead>[] = columnsConfig.filter(c => c.visible).map(col => {
            return {
                id: col.key,
                accessorFn: row => col.is_custom ? row.custom_fields?.[col.key] : (row as any)[col.key],
                header: ({ column }) => <EditableHeader column={column} colConfig={col} />,
                cell: ({ row }) => {
                    const val = col.is_custom ? row.original.custom_fields?.[col.key] : (row.original as any)[col.key];
                    const onUpdate = (newVal: any) => {
                        if (col.is_custom) {
                            const newFields = { ...row.original.custom_fields, [col.key]: newVal };
                            onUpdateLead(row.original.id, 'custom_fields' as any, newFields);
                        } else {
                            onUpdateLead(row.original.id, col.key as any, newVal);
                        }
                    };

                    const toTextLocal = (v: any) => (v === null || v === undefined) ? '' : String(v);

                    if (col.key === 'priority') {
                        const priority = (val as string) || 'COLD';
                        const colorConfig: Record<string, string> = {
                            'ACTIVE': 'bg-lime/10 text-lime border-lime/30',
                            'HOT': 'bg-red-500/20 text-red-300 border-red-500/30',
                            'COLD': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                            'LAVA': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                            'COMPLETED': 'bg-green-500/20 text-green-300 border-green-500/30',
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
                                value={toTextLocal(val) || 'TBA'}
                                options={OFFERING_OPTIONS}
                                onUpdate={onUpdate}
                                className="text-sm text-gray-300"
                            />
                        );
                    }
                    if (col.key === 'record_id') {
                        return <span className="text-xs text-gray-500 px-2 py-1 select-all font-mono">{toTextLocal(val) || '-'}</span>;
                    }
                    // Add logic for boolean fields where 'Yes'/'No' looks cleaner
                    if (['has_coupon', 'paid_full', 'is_payment_plan'].includes(col.key)) {
                        return (
                            <EditableSelectCell
                                value={val === true || val === 'true' ? 'true' : 'false'}
                                options={BOOLEAN_OPTIONS}
                                onUpdate={(newVal) => onUpdate(newVal === 'true')}
                            />
                        );
                    }
                    if (col.type === 'date') {
                        return (
                            <EditableDateCell
                                value={val as string}
                                onUpdate={onUpdate}
                            />
                        );
                    }
                    if (col.type === 'number') {
                        return (
                            <EditableMoneyCell
                                value={val ?? undefined}
                                onUpdate={onUpdate}
                            />
                        );
                    }

                    return (
                        <EditableTextCell
                            value={toTextLocal(val)}
                            onUpdate={onUpdate}
                            multiline={col.key === 'notes' || col.key === 'description'}
                            className={
                                col.key === 'full_name' ? 'font-medium' :
                                    col.key === 'company_name' ? 'text-gray-300' :
                                        col.key === 'email' ? 'text-sm text-gray-400' :
                                            col.key === 'description' ? 'truncate max-w-[200px]' :
                                                col.key === 'notes' ? 'truncate max-w-[200px]' : ''
                            }
                        />
                    );
                },
                meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' }
            };
        });

        const systemCols: ColumnDef<Lead>[] = [
            {
                accessorKey: 'owner_id',
                header: 'Owner ID',
                cell: ({ row }) => (<span className="text-xs text-gray-500">{row.getValue('owner_id') ? String(row.getValue('owner_id')) : '-'}</span>),
                meta: { headerClassName: 'min-w-[220px]', cellClassName: 'min-w-[220px]' }
            },
            {
                accessorKey: 'priority_changed_at',
                header: 'Priority Changed',
                cell: ({ row }) => {
                    const date = row.getValue('priority_changed_at') as string;
                    return <span className="text-xs text-gray-500">{date ? new Date(date).toLocaleDateString() : '-'}</span>;
                },
                meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' }
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const lead = row.original;
                    // Fix paintbucket issue by checking that PaintBucket icon is imported or import it.
                    // Assuming onUpdateLead handles is_highlighted
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => onUpdateLead?.(lead.id, 'is_highlighted', !lead.is_highlighted)}
                                className="p-2 hover:bg-lime/10 rounded-lg text-gray-400 hover:text-lime transition-colors"
                                title={lead.is_highlighted ? "Remove Highlight" : "Highlight Row"}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" /><path d="m5 2 5 5" /><path d="M2 13h15" /><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" /></svg>
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
                meta: { headerClassName: 'min-w-[120px] text-right', cellClassName: 'min-w-[120px]' }
            }
        ];

        return [...dynamicCols, ...systemCols];
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
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
    });

    // BUG-3 fix: use getRowModel() which applies filter + sort pipeline (not getSortedRowModel which ignores filters)
    const allProcessedRows = table.getRowModel().rows;
    const visibleRows = useMemo(() => {
        if (rowsPerPage === 'all') return allProcessedRows;
        return allProcessedRows.slice(0, rowsPerPage);
    }, [allProcessedRows, rowsPerPage]);

    const totalFilteredRows = table.getFilteredRowModel().rows.length;
    const visibleCount = visibleRows.length;

    // Only full_name is sticky — priority and all other columns scroll freely behind it.
    // Having priority also sticky at left-[220px] caused it to overlap Email/adjacent columns
    // because priority (order_index 2) rendered after full_name (order_index 1) in the DOM,
    // making the offset calculations wrong.
    const stickyColumns: Record<string, { left: string; width: string }> = {
        full_name: { left: 'left-0', width: 'w-[220px] min-w-[220px] max-w-[220px]' },
    };

    const getStickyHeaderClass = (columnId: string) => {
        const sticky = stickyColumns[columnId];
        if (!sticky) return '';
        // BUG-13 fix: use bg-bg-elevated (fully opaque) so header never bleeds
        return `sticky ${sticky.left} z-30 ${sticky.width} bg-bg-elevated border-r border-border`;
    };

    const getStickyCellClass = (columnId: string, rowIndex: number) => {
        const sticky = stickyColumns[columnId];
        if (!sticky) return '';
        // BUG-13 fix: fully opaque solid colours – no /80 opacity that causes bleed-through on scroll
        const rowTone = rowIndex % 2 === 0 ? 'bg-[#000000]' : 'bg-[#111111]';
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

                    {/* Column Settings */}
                    <button
                        onClick={onOpenColumnSettings}
                        className="px-4 py-2 rounded-xl border border-lime/30 text-lime bg-lime/10 hover:bg-lime/20 text-sm transition-colors flex items-center gap-2"
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
                        {/* BUG-7 fix: show a chip for active global search text */}
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
            {/* BUG-13 fix: bg-bg-card (solid, no opacity) so sticky cols are never transparent */}
            <div className={`w-full max-w-full overflow-hidden rounded-xl border border-border bg-bg-card ${isUpdating ? 'opacity-70 pointer-events-none' : ''}`}>
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
                                    // BUG-13 fix: solid row backgrounds so sticky cols have correct background on scroll
                                    const rowTone = rowIndex % 2 === 0 ? 'bg-[#000000]' : 'bg-[#111111]';
                                    const isHighlighted = highlightId === row.original.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            id={`lead-row-${row.original.id}`}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={`${rowTone} hover:bg-white/5 transition-colors`}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                                                const stickyClass = getStickyCellClass(cell.column.id, rowIndex);
                                                return (
                                                    <td
                                                        key={cell.id}
                                                        className={`whitespace-nowrap border-b border-border px-4 ${denseMode ? 'py-2' : 'py-3'} text-gray-200 ${meta?.cellClassName || ''} ${stickyClass} ${isHighlighted ? 'bg-lime/5 first:border-l-2 first:border-l-lime/60' : ''}`}
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
