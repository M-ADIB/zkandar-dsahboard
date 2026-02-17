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
            <div className="rounded-2xl border border-dashboard-accent/10 bg-dashboard-card/80 px-6 py-8 text-center text-gray-400 shadow-[0_0_0_1px_rgba(208,255,113,0.08)]">
                Loading data...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-dashboard-accent/10 bg-dashboard-card/80 px-6 py-8 text-center text-gray-400 shadow-[0_0_0_1px_rgba(208,255,113,0.08)]">
                No records found.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-dashboard-accent/10 bg-dashboard-card/80 shadow-[0_0_0_1px_rgba(208,255,113,0.08)]">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-sm">
                    <thead className="bg-gradient-to-r from-[#161C2A] via-[#141a2a] to-[#101522]">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                scope="col"
                                className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-300 ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th scope="col" className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((item, index) => {
                            const rowTone = index % 2 === 0 ? 'bg-[#0F1219]/70' : 'bg-[#121827]/70'
                            return (
                                <tr
                                    key={item.id}
                                    className={`${rowTone} hover:bg-[#1A2233] transition-colors`}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={`whitespace-nowrap px-6 py-4 text-sm text-gray-200 ${col.className || ''}`}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="text-dashboard-accent hover:text-dashboard-accent-bright mr-4"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="text-red-400 hover:text-red-300"
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
