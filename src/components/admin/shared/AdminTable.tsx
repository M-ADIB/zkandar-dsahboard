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
        return <div className="p-8 text-center text-gray-400">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-gray-400">No records found.</div>;
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#1A1F2E]">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                scope="col"
                                className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#0F1219]">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-[#1A1F2E] transition-colors">
                            {columns.map((col, idx) => (
                                <td
                                    key={idx}
                                    className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-300 sm:pl-6 ${col.className || ''}`}
                                >
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(item)
                                        : (item[col.accessor] as React.ReactNode)}
                                </td>
                            ))}
                            {(onEdit || onDelete) && (
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}
