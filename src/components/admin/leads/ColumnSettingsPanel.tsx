import { useState } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, Plus, Trash2, Lock, Eye, EyeOff, Settings2, Pencil } from 'lucide-react';
import { LeadColumn, LeadColumnOption } from '@/types/database';
import { Portal } from '@/components/shared/Portal';

// Columns that cannot be deleted, hidden, or reordered before NAME
const PROTECTED_KEYS = new Set(['full_name', 'email', 'priority']);
const NAME_KEY = 'full_name';

const COLUMN_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'url', label: 'URL' },
];

const OPTION_COLORS = [
    { value: 'lime', label: 'Green', bg: 'bg-lime/20 text-lime border-lime/40' },
    { value: 'red', label: 'Red', bg: 'bg-red-500/20 text-red-300 border-red-500/40' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
];

function colorBg(color?: string) {
    return OPTION_COLORS.find(c => c.value === color)?.bg ?? 'bg-gray-500/20 text-gray-300 border-gray-500/40';
}

interface ColumnSettingsPanelProps {
    columns: LeadColumn[];
    onClose: () => void;
    onAddColumn: (label: string, type: string, options: LeadColumnOption[]) => void;
    onUpdateColumn: (colId: string, updates: Partial<LeadColumn>) => void;
    onDeleteColumn: (colId: string, colKey: string) => void;
    onReorderColumn: (colId: string, direction: 'up' | 'down') => void;
}

interface EditingCol {
    id: string;
    label: string;
    options: LeadColumnOption[];
}

export function ColumnSettingsPanel({
    columns,
    onClose,
    onAddColumn,
    onUpdateColumn,
    onDeleteColumn,
    onReorderColumn,
}: ColumnSettingsPanelProps) {
    // Sorted visible + invisible columns
    const sortedCols = [...columns].sort((a, b) => a.order_index - b.order_index);

    // Add-column form state
    const [addLabel, setAddLabel] = useState('');
    const [addType, setAddType] = useState('text');
    const [addOptions, setAddOptions] = useState<LeadColumnOption[]>([]);
    const [newOptionLabel, setNewOptionLabel] = useState('');
    const [newOptionColor, setNewOptionColor] = useState('gray');
    const [addError, setAddError] = useState('');

    // Inline label/options editing state
    const [editingCol, setEditingCol] = useState<EditingCol | null>(null);
    const [editNewOptionLabel, setEditNewOptionLabel] = useState('');
    const [editNewOptionColor, setEditNewOptionColor] = useState('gray');

    // Delete confirmation state
    const [pendingDelete, setPendingDelete] = useState<LeadColumn | null>(null);

    // ---- ADD COLUMN ----
    const handleAdd = () => {
        const trimmed = addLabel.trim();
        if (!trimmed) { setAddError('Column name is required.'); return; }
        if (columns.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
            setAddError('A column with that name already exists.');
            return;
        }
        setAddError('');
        onAddColumn(trimmed, addType, addType === 'select' ? addOptions : []);
        setAddLabel('');
        setAddType('text');
        setAddOptions([]);
    };

    const addOptionToNewCol = () => {
        if (!newOptionLabel.trim()) return;
        setAddOptions(prev => [...prev, { label: newOptionLabel.trim(), color: newOptionColor }]);
        setNewOptionLabel('');
    };

    const removeAddOption = (idx: number) => {
        setAddOptions(prev => prev.filter((_, i) => i !== idx));
    };

    // ---- EDIT COLUMN ----
    const startEdit = (col: LeadColumn) => {
        setEditingCol({ id: col.id, label: col.label, options: [...(col.options ?? [])] });
        setEditNewOptionLabel('');
        setEditNewOptionColor('gray');
    };

    const saveEdit = () => {
        if (!editingCol) return;
        const updates: Partial<LeadColumn> = {};
        const orig = columns.find(c => c.id === editingCol.id);
        if (orig) {
            if (editingCol.label.trim() && editingCol.label !== orig.label) {
                updates.label = editingCol.label.trim();
            }
            updates.options = editingCol.options;
        }
        if (Object.keys(updates).length > 0) {
            onUpdateColumn(editingCol.id, updates);
        }
        setEditingCol(null);
    };

    const addOptionToEdit = () => {
        if (!editNewOptionLabel.trim() || !editingCol) return;
        setEditingCol(prev => prev ? {
            ...prev,
            options: [...prev.options, { label: editNewOptionLabel.trim(), color: editNewOptionColor }]
        } : null);
        setEditNewOptionLabel('');
    };

    const removeEditOption = (idx: number) => {
        setEditingCol(prev => prev ? { ...prev, options: prev.options.filter((_, i) => i !== idx) } : null);
    };

    const updateEditOptionLabel = (idx: number, label: string) => {
        setEditingCol(prev => prev ? {
            ...prev,
            options: prev.options.map((o, i) => i === idx ? { ...o, label } : o)
        } : null);
    };

    const updateEditOptionColor = (idx: number, color: string) => {
        setEditingCol(prev => prev ? {
            ...prev,
            options: prev.options.map((o, i) => i === idx ? { ...o, color } : o)
        } : null);
    };

    // ---- VISIBILITY ----
    const toggleVisibility = (col: LeadColumn) => {
        if (PROTECTED_KEYS.has(col.key)) return;
        onUpdateColumn(col.id, { visible: !col.visible });
    };

    // ---- REORDER ----
    const canMoveUp = (col: LeadColumn) => {
        const idx = sortedCols.findIndex(c => c.id === col.id);
        if (idx <= 0) return false;
        // Cannot move above the NAME column
        const nameIdx = sortedCols.findIndex(c => c.key === NAME_KEY);
        if (idx <= nameIdx) return false;
        return true;
    };

    const canMoveDown = (col: LeadColumn) => {
        const idx = sortedCols.findIndex(c => c.id === col.id);
        if (idx >= sortedCols.length - 1) return false;
        // NAME column cannot move down
        if (col.key === NAME_KEY) return false;
        return true;
    };

    return (
        <Portal>
        <div className="fixed inset-0 z-[71] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div className="relative flex flex-col w-full max-w-[420px] h-full bg-bg-elevated border-l border-border overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-lime" />
                        <span className="text-base font-semibold text-white">Column Settings</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
                        {sortedCols.length} columns — drag to reorder, toggle to show/hide
                    </p>

                    {sortedCols.map((col) => {
                        const isProtected = PROTECTED_KEYS.has(col.key);
                        const isEditing = editingCol?.id === col.id;
                        const colType = COLUMN_TYPES.find(t => t.value === col.type)?.label ?? col.type;

                        return (
                            <div
                                key={col.id}
                                className={`rounded-xl border ${isProtected ? 'border-lime/20 bg-lime/5' : 'border-border bg-bg-card/60'} transition-colors`}
                            >
                                {/* Column row header */}
                                <div className="flex items-center gap-2 px-3 py-2.5">
                                    {/* Reorder arrows */}
                                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                                        <button
                                            onClick={() => canMoveUp(col) && onReorderColumn(col.id, 'up')}
                                            disabled={!canMoveUp(col)}
                                            className="text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            title="Move up"
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => canMoveDown(col) && onReorderColumn(col.id, 'down')}
                                            disabled={!canMoveDown(col)}
                                            className="text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            title="Move down"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />

                                    {/* Label & type */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {isProtected && <Lock className="h-3 w-3 text-lime/60 flex-shrink-0" />}
                                            <span className="text-sm font-medium text-gray-100 truncate">{col.label}</span>
                                        </div>
                                        <span className="text-[11px] text-gray-500">{colType}{col.is_custom ? ' · custom' : ''}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* Visibility toggle */}
                                        <button
                                            onClick={() => toggleVisibility(col)}
                                            disabled={isProtected}
                                            className={`p-1.5 rounded-lg transition-colors ${isProtected ? 'text-gray-600 cursor-not-allowed' : col.visible ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}
                                            title={isProtected ? 'Protected — cannot hide' : col.visible ? 'Hide column' : 'Show column'}
                                        >
                                            {col.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>

                                        {/* Edit button */}
                                        <button
                                            onClick={() => isEditing ? saveEdit() : startEdit(col)}
                                            className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'text-lime bg-lime/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                            title={isEditing ? 'Save changes' : 'Edit column'}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>

                                        {/* Delete button — non-protected only */}
                                        {!isProtected && (
                                            <button
                                                onClick={() => setPendingDelete(col)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                                                title="Delete column"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline edit form */}
                                {isEditing && editingCol && (
                                    <div className="px-3 pb-3 border-t border-border/60 pt-3 space-y-3">
                                        {/* Rename */}
                                        <div>
                                            <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={editingCol.label}
                                                onChange={e => setEditingCol(prev => prev ? { ...prev, label: e.target.value } : null)}
                                                className="w-full bg-bg-primary/60 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-lime/40"
                                                placeholder="Column label"
                                            />
                                            <p className="text-[10px] text-gray-600 mt-0.5">The underlying field key does not change.</p>
                                        </div>

                                        {/* Dropdown options editor */}
                                        {col.type === 'select' && (
                                            <div>
                                                <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1">Dropdown Options</label>
                                                <div className="space-y-1.5 mb-2">
                                                    {editingCol.options.map((opt, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={opt.label}
                                                                onChange={e => updateEditOptionLabel(idx, e.target.value)}
                                                                className="flex-1 bg-bg-primary/60 border border-border rounded-lg px-2 py-1 text-xs text-gray-100 outline-none focus:border-lime/40"
                                                            />
                                                            <select
                                                                value={opt.color ?? 'gray'}
                                                                onChange={e => updateEditOptionColor(idx, e.target.value)}
                                                                className="bg-bg-primary/60 border border-border rounded-lg px-1 py-1 text-xs text-gray-100 outline-none focus:border-lime/40"
                                                            >
                                                                {OPTION_COLORS.map(c => (
                                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                                ))}
                                                            </select>
                                                            <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colorBg(opt.color)}`}>
                                                                {opt.label || 'Preview'}
                                                            </span>
                                                            <button onClick={() => removeEditOption(idx)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editNewOptionLabel}
                                                        onChange={e => setEditNewOptionLabel(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addOptionToEdit()}
                                                        placeholder="New option..."
                                                        className="flex-1 bg-bg-primary/60 border border-border rounded-lg px-2 py-1 text-xs text-gray-100 outline-none focus:border-lime/40"
                                                    />
                                                    <select
                                                        value={editNewOptionColor}
                                                        onChange={e => setEditNewOptionColor(e.target.value)}
                                                        className="bg-bg-primary/60 border border-border rounded-lg px-1 py-1 text-xs text-gray-100 outline-none"
                                                    >
                                                        {OPTION_COLORS.map(c => (
                                                            <option key={c.value} value={c.value}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={addOptionToEdit}
                                                        className="px-2 py-1 bg-lime/10 text-lime border border-lime/30 rounded-lg text-xs hover:bg-lime/20 transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={saveEdit}
                                                className="flex-1 px-3 py-1.5 bg-lime/10 text-lime border border-lime/30 rounded-lg text-sm hover:bg-lime/20 transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingCol(null)}
                                                className="px-3 py-1.5 border border-border text-gray-400 rounded-lg text-sm hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add Column form */}
                <div className="flex-shrink-0 border-t border-border px-5 py-4 space-y-3 bg-bg-elevated">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Add Column</p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={addLabel}
                            onChange={e => { setAddLabel(e.target.value); setAddError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Column name..."
                            className="flex-1 bg-bg-primary/60 border border-border rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-lime/40"
                        />
                        <select
                            value={addType}
                            onChange={e => setAddType(e.target.value)}
                            className="bg-bg-primary/60 border border-border rounded-lg px-2 py-2 text-sm text-gray-100 outline-none focus:border-lime/40"
                        >
                            {COLUMN_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dropdown options builder */}
                    {addType === 'select' && (
                        <div className="space-y-2">
                            <label className="block text-[11px] text-gray-500 uppercase tracking-wider">Options</label>
                            <div className="space-y-1.5">
                                {addOptions.map((opt, idx) => (
                                    <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${colorBg(opt.color)}`}>
                                        <span className="text-xs font-medium">{opt.label}</span>
                                        <button onClick={() => removeAddOption(idx)} className="ml-2 opacity-60 hover:opacity-100">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newOptionLabel}
                                    onChange={e => setNewOptionLabel(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addOptionToNewCol()}
                                    placeholder="Option label..."
                                    className="flex-1 bg-bg-primary/60 border border-border rounded-lg px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-lime/40"
                                />
                                <select
                                    value={newOptionColor}
                                    onChange={e => setNewOptionColor(e.target.value)}
                                    className="bg-bg-primary/60 border border-border rounded-lg px-2 py-1.5 text-xs text-gray-100 outline-none"
                                >
                                    {OPTION_COLORS.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={addOptionToNewCol}
                                    className="px-2 py-1.5 bg-lime/10 text-lime border border-lime/30 rounded-lg text-xs hover:bg-lime/20 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    {addError && <p className="text-xs text-red-400">{addError}</p>}

                    <button
                        onClick={handleAdd}
                        disabled={!addLabel.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-lime/10 text-lime border border-lime/30 rounded-xl text-sm hover:bg-lime/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-4 w-4" />
                        Add Column
                    </button>
                </div>
            </div>

            {/* Delete confirmation overlay */}
            {pendingDelete && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="bg-bg-elevated border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
                        <h3 className="text-base font-semibold text-white">Delete column?</h3>
                        <p className="text-sm text-gray-400">
                            Delete <span className="text-white font-medium">"{pendingDelete.label}"</span>?
                            All data stored in this column will be lost. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    onDeleteColumn(pendingDelete.id, pendingDelete.key);
                                    setPendingDelete(null);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setPendingDelete(null)}
                                className="flex-1 px-4 py-2 border border-border text-gray-300 hover:text-white rounded-xl text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </Portal>
    );
}
