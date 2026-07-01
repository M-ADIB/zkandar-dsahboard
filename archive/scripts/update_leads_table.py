import re

with open('src/components/admin/leads/LeadsTable.tsx', 'r') as f:
    content = f.read()

# Find start of columns
start_marker = 'const columns = useMemo<ColumnDef<Lead>[]>(() => ['
start_idx = content.find(start_marker)

# Find end of columns array
# It ends around line 730
end_marker = '            meta: { headerClassName: \'min-w-[120px] text-right\', cellClassName: \'min-w-[120px]\' }\n        }\n    ], [onUpdateLead, onUpdatePriority, onEdit, onDelete]);'

end_idx = content.find(end_marker) + len(end_marker)

dynamic_columns_code = """
    // Add EditableHeader component inside or outside LeadsTable
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
                            className="flexitems-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
            const accessorId = col.is_custom ? col.key : col.key;
            
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

                    // Specific renderers for known keys
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
                                value={toText(val) || 'TBA'}
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
                        return <span className="text-xs text-gray-500 px-2 py-1 select-all font-mono">{toText(val) || '-'}</span>;
                    }

                    // Default renderers based on col type
                    switch (col.type) {
                        case 'boolean':
                            return (
                                <EditableSelectCell
                                    value={normalizeBoolean(val)}
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
                                    value={val ?? undefined} // Or basic number cell, using MoneyCell for convenience
                                    onUpdate={onUpdate}
                                />
                            );
                        default: // text
                            return (
                                <EditableTextCell
                                    value={toText(val)}
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

        // Add System Columns
        const systemCols: ColumnDef<Lead>[] = [
            {
                accessorKey: 'owner_id',
                header: 'Owner ID',
                cell: ({ row }) => (<span className="text-xs text-gray-500">{toText(row.getValue('owner_id')) || '-'}</span>),
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
                    // ... existing logic simplified
                    if (Array.isArray(values)) label = values.filter(Boolean).join(', ') || '-';
                    else if (typeof values === 'string') label = values.trim() || '-';
                    return <span className="text-xs text-gray-500">{label}</span>;
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
    }, [columnsConfig, onUpdateColumn, onDeleteColumn, onUpdateLead, onUpdatePriority, onEdit, onDelete]);"""

new_content = content[:start_idx] + dynamic_columns_code + content[end_idx:]

with open('src/components/admin/leads/LeadsTable.tsx', 'w') as f:
    f.write(new_content)

