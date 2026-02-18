import { useState, useEffect, useRef } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

interface EditableMoneyCellProps {
    value: number | undefined;
    onUpdate: (value: number) => void;
    className?: string;
}

export function EditableMoneyCell({ value, onUpdate, className = '' }: EditableMoneyCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value?.toString() || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const numValue = parseFloat(localValue);
        if (!isNaN(numValue) && numValue !== value) {
            onUpdate(numValue);
        } else if (localValue === '' && value !== undefined) {
            // Handle clearing the value if needed, for now let's persist 0 or previous
            if (value !== 0) onUpdate(0);
        }
        else {
            setLocalValue(value?.toString() || '');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalValue(value?.toString() || '');
        }
    };

    if (isEditing) {
        return (
            <div className="relative w-full">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">AED</span>
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-bg-elevated border border-border rounded-md pl-11 pr-2 py-1 text-sm text-white focus:outline-none focus:border-lime/60 ${className}`}
                />
            </div>
        );
    }

    const hasValue = value !== undefined && value !== null;
    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-text px-2 py-1 min-h-[28px] flex items-center transition-colors hover:bg-white/5 ${!hasValue ? 'text-gray-500' : 'text-gray-200'} ${className}`}
        >
            {hasValue ? currencyFormatter.format(value) : '-'}
        </div>
    );
}
