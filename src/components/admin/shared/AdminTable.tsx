import React from 'react';

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
        <div className="overflow-hidden rounded-xl border border-border bg-bg-card/80">
            <div className="w-full max-w-full overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead className="bg-bg-elevated">
                        <tr>
                            {hasCheckboxes && (
                                <th scope="col" className="w-10 px-4 py-3 border-b border-border">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                                    />
                                </th>
                            )}
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-border ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {(onEdit || onDelete) && (
                                <th scope="col" className="relative px-5 py-3 border-b border-border">
                                    <span className="sr-only">Actions</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            const rowTone = index % 2 === 0 ? 'bg-bg-primary/60' : 'bg-bg-card/60';
                            const isSelected = selectedIds?.includes(item.id) ?? false;
                            return (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={`${rowTone} hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-lime/5' : ''}`}
                                >
                                    {hasCheckboxes && (
                                        <td className="w-10 px-4 py-3 border-b border-border" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectRow(e, item.id)}
                                                className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                                            />
                                        </td>
                                    )}
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={`whitespace-nowrap px-5 py-3 text-sm text-gray-200 border-b border-border ${col.className || ''}`}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium border-b border-border">
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
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
