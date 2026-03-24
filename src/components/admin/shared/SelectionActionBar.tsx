

interface SelectionActionBarProps {
    selectedCount: number;
    onEdit?: () => void;
    onDelete: () => void;
}

export function SelectionActionBar({ selectedCount, onEdit, onDelete }: SelectionActionBarProps) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-sm text-gray-400 font-medium">{selectedCount} selected</span>
            <div className="h-4 w-px bg-border" />
            {selectedCount === 1 && onEdit && (
                <button
                    onClick={onEdit}
                    className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
                >
                    Edit
                </button>
            )}
            <button
                onClick={onDelete}
                className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
            >
                Delete
            </button>
        </div>
    );
}
