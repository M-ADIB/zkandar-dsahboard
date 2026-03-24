
import { ModalForm } from './ModalForm';

interface BulkDeleteConfirmProps {
    isOpen: boolean;
    count: number;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemLabel?: string;
}

export function BulkDeleteConfirm({ isOpen, count, isLoading, onClose, onConfirm, itemLabel = 'item' }: BulkDeleteConfirmProps) {
    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Delete"
            showActions={false}
        >
            <p className="text-gray-300 text-sm">
                Delete <span className="text-white font-semibold">{count}</span> {itemLabel}{count !== 1 ? 's' : ''}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </ModalForm>
    );
}
