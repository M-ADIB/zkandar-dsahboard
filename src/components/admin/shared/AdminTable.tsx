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
    isLoading?: boolean;
}

export function AdminTable<T extends { id: string }>({
    data,
    columns,
    onEdit,
    onDelete,
    isLoading
}: AdminTableProps<T>) {
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
                            const rowTone = index % 2 === 0 ? 'bg-bg-primary/60' : 'bg-bg-card/60'
                            return (
                                <tr
                                    key={item.id}
                                    className={`${rowTone} hover:bg-white/5 transition-colors`}
                                >
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
                                                    onClick={() => onEdit(item)}
                                                    className="text-gray-300 hover:text-white mr-4"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="text-gray-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
