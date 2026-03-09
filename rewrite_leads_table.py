import re

with open('src/components/admin/leads/LeadsTable.tsx', 'r') as f:
    code = f.read()

# 1. Imports
code = re.sub(r'import \{ Lead \} from \'@/types/database\';', 'import { Lead, LeadColumn } from \'@/types/database\';', code)
code = re.sub(r'PaintBucket,\n    X,\n\} from \'lucide-react\';', 'PaintBucket,\n    Plus,\n    X,\n} from \'lucide-react\';', code)

# 2. LeadsTableProps
props_search = r'''interface LeadsTableProps \{
    data: Lead\[\];
    onEdit: \(lead: Lead\) => void;
    onDelete: \(lead: Lead\) => void;
    onUpdatePriority: \(leadId: string, priority: string\) => void;
    onUpdateLead: \(leadId: string, field: keyof Lead, value: any\) => void;
    isUpdating\?: string \| null;
    highlightId\?: string \| null;
\}'''

props_replace = '''interface LeadsTableProps {
    data: Lead[];
    columnsConfig: LeadColumn[];
    onAddColumn: (label: string, type?: string) => void;
    onUpdateColumn: (colId: string, updates: Partial<LeadColumn>) => void;
    onDeleteColumn: (colId: string, colKey: string) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onUpdatePriority: (leadId: string, priority: string) => void;
    onUpdateLead: (leadId: string, field: keyof Lead, value: any) => void;
    isUpdating?: string | null;
    highlightId?: string | null;
}'''

code = re.sub(props_search, props_replace, code)

# 3. Component signature
sig_search = r'''export function LeadsTable\(\{
    data,
    onEdit,
    onDelete,
    onUpdatePriority,
    onUpdateLead,
    isUpdating,
    highlightId
\}: LeadsTableProps\) \{'''

sig_replace = '''export function LeadsTable({
    data,
    columnsConfig,
    onAddColumn,
    onUpdateColumn,
    onDeleteColumn,
    onEdit,
    onDelete,
    onUpdatePriority,
    onUpdateLead,
    isUpdating,
    highlightId
}: LeadsTableProps) {'''

code = re.sub(sig_search, sig_replace, code)

# 4. Replace hardcoded columns logic
# Use regex to match from `const columns = useMemo<ColumnDef<Lead>[]>(() => [`
# up to `    ], [onEdit, onDelete, onUpdatePriority, onUpdateLead]);`

col_code = r'''const EditableHeader = ({ column, colConfig }: { column: any, colConfig: LeadColumn }) => {
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
                                    if(confirm('Delete custom column?')) {
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
                    if (col.key === 'notes') {
                        return <NotesPopoverCell row={row} onUpdateLead={onUpdateLead} />;
                    }
                    if (col.key === 'record_id') {
                        return <span className="text-xs text-gray-500 px-2 py-1 select-all font-mono">{toTextLocal(val) || '-'}</span>;
                    }

                    switch (col.type) {
                        case 'boolean':
                            return (
                                <EditableSelectCell
                                    value={val === true || val === 'true' ? 'true' : 'false'}
                                    options={BOOLEAN_OPTIONS}
                                    onUpdate={(newVal) => onUpdate(newVal === 'true')}
                                />
                            );
                        case 'date':
                            return (
                                <EditableDateCell
                                    value={val as string}
                                    onUpdate={onUpdate}
                                />
                            );
                        case 'number':
                            return (
                                <EditableMoneyCell
                                    value={val ?? undefined}
                                    onUpdate={onUpdate}
                                />
                            );
                        default:
                            return (
                                <EditableTextCell
                                    value={toTextLocal(val)}
                                    onUpdate={onUpdate}
                                    className={
                                        col.key === 'full_name' ? 'font-medium' : 
                                        col.key === 'company_name' ? 'text-gray-300' :
                                        col.key === 'email' ? 'text-sm text-gray-400' :
                                        col.key === 'description' ? 'truncate' : ''
                                    }
                                />
                            );
                    }
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
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => onUpdateLead(lead.id, 'is_highlighted', !lead.is_highlighted)}
                                className="p-2 hover:bg-lime/10 rounded-lg text-gray-400 hover:text-lime transition-colors"
                                title={lead.is_highlighted ? "Remove Highlight" : "Highlight Row"}
                            >
                                <PaintBucket className="h-4 w-4" />
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
    }, [columnsConfig, onUpdateColumn, onDeleteColumn, onUpdateLead, onUpdatePriority, onEdit, onDelete]);'''

code = re.sub(
    r'const columns = useMemo<ColumnDef<Lead>\[\]>\(\(\) => \[.*?\n    \], \[onEdit, onDelete, onUpdatePriority, onUpdateLead\]\);',
    col_code,
    code,
    flags=re.DOTALL
)

# 5. Add custom Column button next to Compact Rows button
toolbar_search = r'''\{denseMode \? 'Compact rows' : 'Comfort rows'\}
                    </button>
                </div>'''

toolbar_replace = '''{denseMode ? 'Compact rows' : 'Comfort rows'}
                    </button>

                    {/* Add Column */}
                    <button
                        onClick={() => {
                            const name = prompt('Enter custom column name:');
                            if (name && name.trim()) onAddColumn(name.trim(), 'text');
                        }}
                        className="px-4 py-2 rounded-xl border border-lime/30 text-lime bg-lime/10 hover:bg-lime/20 text-sm transition-colors flex items-center gap-2"
                        title="Add custom text column"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Column</span>
                    </button>
                </div>'''

code = re.sub(toolbar_search, toolbar_replace, code)

with open('src/components/admin/leads/LeadsTable.tsx', 'w') as f:
    f.write(code)

