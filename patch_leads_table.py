import re

with open('src/components/admin/leads/LeadsTable.tsx', 'r') as f:
    lines = f.readlines()

# 1. Imports (around line 13)
# import { Lead } from '@/types/database'; -> import { Lead, LeadColumn } from '@/types/database';
for i, line in enumerate(lines):
    if "import { Lead } from '@/types/database';" in line:
        lines[i] = "import { Lead, LeadColumn } from '@/types/database';\n"
        break

# Add Plus to lucide-react imports
for i, line in enumerate(lines):
    if "ChevronDown" in line and "lucide-react" not in line: # It's in the multiline block
        for j in range(i, i+5):
            if "} from 'lucide-react';" in lines[j]:
                lines[j] = "    Plus,\n} from 'lucide-react';\n"
                # wait, in restored script it is:
                #     ChevronDown
                # } from 'lucide-react';
                lines[i] = "    ChevronDown,\n" # Ensure trailing comma on ChevronDown
                break
        break

# 2. LeadsTableProps
start_props = -1
end_props = -1
for i, line in enumerate(lines):
    if "interface LeadsTableProps {" in line:
        start_props = i
    if start_props != -1 and "}" in line:
        end_props = i
        break

if start_props != -1:
    lines[start_props:end_props+1] = [
        "interface LeadsTableProps {\n",
        "    data: Lead[];\n",
        "    columnsConfig: LeadColumn[];\n",
        "    onAddColumn: (label: string, type?: string) => void;\n",
        "    onUpdateColumn: (colId: string, updates: Partial<LeadColumn>) => void;\n",
        "    onDeleteColumn: (colId: string, colKey: string) => void;\n",
        "    onEdit: (lead: Lead) => void;\n",
        "    onDelete: (lead: Lead) => void;\n",
        "    onUpdatePriority: (leadId: string, priority: string) => void;\n",
        "    onUpdateLead: (leadId: string, field: keyof Lead, value: any) => void;\n",
        "    isUpdating?: string | null;\n",
        "    highlightId?: string | null;\n",
        "}\n"
    ]

# 3. Component signature export function LeadsTable({ ... }) {
start_sig = -1
end_sig = -1
for i, line in enumerate(lines):
    if "export function LeadsTable({" in line:
        start_sig = i
    if start_sig != -1 and ": LeadsTableProps) {" in line:
        end_sig = i
        break

if start_sig != -1:
    lines[start_sig:end_sig+1] = [
        "export function LeadsTable({\n",
        "    data,\n",
        "    columnsConfig,\n",
        "    onAddColumn,\n",
        "    onUpdateColumn,\n",
        "    onDeleteColumn,\n",
        "    onEdit,\n",
        "    onDelete,\n",
        "    onUpdatePriority,\n",
        "    onUpdateLead,\n",
        "    isUpdating,\n",
        "    highlightId\n",
        "}: LeadsTableProps) {\n"
    ]

# 4. Replace const columns = useMemo to ], [onEdit, onDelete, onUpdatePriority, onUpdateLead]);
start_col = -1
end_col = -1
for i, line in enumerate(lines):
    if "const columns = useMemo<ColumnDef<Lead>[]>(() => [" in line:
        start_col = i
    if start_col != -1 and "], [onEdit, onDelete, onUpdatePriority, onUpdateLead]);" in line:
        end_col = i
        break

col_code = """
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
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>
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
"""

if start_col != -1 and end_col != -1:
    lines = lines[:start_col] + [col_code] + lines[end_col+1:]

# 5. Add custom Column button next to Compact Rows button
toolbar_search = -1
for i, line in enumerate(lines):
    if "{denseMode ? 'Compact rows' : 'Comfort rows'}" in line:
        toolbar_search = i
        break

if toolbar_search != -1:
    toolbar_replace = """{denseMode ? 'Compact rows' : 'Comfort rows'}
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
                    """
    lines[toolbar_search] = toolbar_replace

with open('src/components/admin/leads/LeadsTable.tsx', 'w') as f:
    f.writelines(lines)

