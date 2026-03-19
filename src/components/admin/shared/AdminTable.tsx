import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Edit2, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface AdminTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    getRowUrl?: (item: T) => string;
}

export function AdminTable<T extends { id: string }>({
    data,
    columns,
    onEdit,
    onDelete,
    onRowClick,
    isLoading,
    selectedIds,
    onSelectionChange,
    getRowUrl,
}: AdminTableProps<T>) {
    const hasCheckboxes = Boolean(onSelectionChange);
    const allSelected = hasCheckboxes && data.length > 0 && selectedIds?.length === data.length;
    const someSelected = hasCheckboxes && (selectedIds?.length ?? 0) > 0 && !allSelected;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onSelectionChange) return;
        onSelectionChange(e.target.checked ? data.map((item) => item.id) : []);
    };

    const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (!onSelectionChange || !selectedIds) return;
        e.stopPropagation();
        onSelectionChange(
            e.target.checked ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id)
        );
    };

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-bg-card/80 px-6 py-8 text-center text-gray-400">
                Loading data...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-bg-card/80 px-6 py-8 text-center text-gray-400">
                No records found.
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] shadow-sm hover:border-white/[0.12] transition-colors">
            <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead className="bg-[#0a0a0a]">
                        <tr>
                            {hasCheckboxes && (
                                <th scope="col" className="w-10 px-4 py-3 border-b border-white/[0.08]">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] accent-lime cursor-pointer hover:ring-1 hover:ring-lime/50 transition-all"
                                    />
                                </th>
                            )}
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 border-b border-white/[0.08] ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {(onEdit || onDelete) && (
                                <th scope="col" className="relative px-5 py-3 border-b border-white/[0.08]">
                                    <span className="sr-only">Actions</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            const rowTone = index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]';
                            const isSelected = selectedIds?.includes(item.id) ?? false;
                            
                            const rowContent = (
                                <>
                                    {hasCheckboxes && (
                                        <td className="w-10 px-4 py-3 border-b border-white/[0.05]" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectRow(e, item.id)}
                                                className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] accent-lime cursor-pointer hover:ring-1 hover:ring-lime/50 transition-all"
                                            />
                                        </td>
                                    )}
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={`whitespace-nowrap px-5 py-3 text-sm text-gray-200 border-b border-white/[0.05] ${col.className || ''}`}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium border-b border-white/[0.05]">
                                            {onEdit && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                    className="text-gray-300 hover:text-white mr-4"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                    className="text-gray-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </>
                            );

                            return (
                                <ContextMenu.Root key={item.id}>
                                    <ContextMenu.Trigger asChild>
                                        <tr
                                            onClick={() => onRowClick?.(item)}
                                            className={`${rowTone} hover:bg-white/[0.03] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? '!bg-lime/5 shadow-[inset_2px_0_0_0_#D0FF71]' : ''}`}
                                        >
                                            {rowContent}
                                        </tr>
                                    </ContextMenu.Trigger>
                                    <ContextMenu.Portal>
                                        <ContextMenu.Content className="min-w-[220px] backdrop-blur-xl bg-black/80 border border-white/10 rounded-xl p-1.5 shadow-2xl z-[100] animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                                            {onEdit && (
                                                <ContextMenu.Item
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 outline-none hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                                                    onSelect={() => onEdit(item)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                    <span>Edit</span>
                                                    <div className="ml-auto text-xs text-gray-500 tracking-widest font-mono">⌘E</div>
                                                </ContextMenu.Item>
                                            )}
                                            <ContextMenu.Item
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 outline-none hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                                                onSelect={() => {
                                                    navigator.clipboard.writeText(item.id);
                                                    toast.success('ID copied to clipboard');
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span>Copy ID</span>
                                                <div className="ml-auto text-xs text-gray-500 tracking-widest font-mono">⌘C</div>
                                            </ContextMenu.Item>
                                            {getRowUrl && (
                                                <ContextMenu.Item
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 outline-none hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                                                    onSelect={() => window.open(getRowUrl(item), '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span>Open in New Tab</span>
                                                </ContextMenu.Item>
                                            )}
                                            
                                            {onDelete && (
                                                <>
                                                    <ContextMenu.Separator className="h-px bg-border my-1.5" />
                                                    <ContextMenu.Item
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 outline-none hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                                                        onSelect={() => onDelete(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>Delete</span>
                                                        <div className="ml-auto text-xs text-red-500/50 tracking-widest font-mono">⌫</div>
                                                    </ContextMenu.Item>
                                                </>
                                            )}
                                        </ContextMenu.Content>
                                    </ContextMenu.Portal>
                                </ContextMenu.Root>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
