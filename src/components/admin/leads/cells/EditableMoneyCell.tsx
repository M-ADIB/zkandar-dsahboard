import { useState, useEffect, useRef } from 'react';
import { useGridNavigation } from '../hooks/useGridNavigation';

const currencyFormatter = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-AE', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

interface EditableMoneyCellProps {
    value: number | undefined;
    // BUG-4 fix: allow null so clearing a field saves null instead of 0
    onUpdate: (value: number | null) => void;
    className?: string;
    format?: 'currency' | 'percentage' | 'number';
}

export function EditableMoneyCell({ value, onUpdate, className = '', format = 'currency' }: EditableMoneyCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value?.toString() || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    // Apply grid navigation
    useGridNavigation(cellRef, isEditing, (initialChar) => {
        if (initialChar) {
            setLocalValue(initialChar);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
        setIsEditing(true);
    });

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = (e?: React.FocusEvent) => {
        if (e && cellRef.current && cellRef.current.contains(e.relatedTarget as Node)) return;

        setIsEditing(false);
        if (localValue.trim() === '') {
            if (value !== undefined && value !== null) {
                onUpdate(null);
            }
        } else {
            const numValue = parseFloat(localValue);
            if (!isNaN(numValue) && numValue !== value) {
                onUpdate(numValue);
            } else if (isNaN(numValue)) {
                setLocalValue(value?.toString() || '');
            }
        }

        requestAnimationFrame(() => {
            if (!document.activeElement || document.activeElement.tagName === 'BODY') {
                cellRef.current?.focus();
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
            setLocalValue(value?.toString() || '');
            requestAnimationFrame(() => cellRef.current?.focus());
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();

            const td = cellRef.current?.closest('td');
            const tr = td?.closest('tr');
            if (td && tr && tr.nextElementSibling) {
                const colIndex = Array.from(tr.children).indexOf(td);
                const nextTd = tr.nextElementSibling.children[colIndex];
                (nextTd?.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
            }
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            handleBlur();

            const td = cellRef.current?.closest('td');
            if (td) {
                const targetTd = e.shiftKey ? td.previousElementSibling : td.nextElementSibling;
                (targetTd?.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
            }
            return;
        }
    };

    if (isEditing) {
        return (
            <div ref={cellRef} tabIndex={-1} className="relative w-full">
                {format === 'currency' && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">AED</span>}
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-bg-elevated border-2 border-lime rounded-md px-2 py-1 text-sm text-white outline-none shadow-[0_0_10px_rgba(182,233,65,0.2)] ${format === 'currency' ? 'pl-11' : ''} ${className}`}
                />
                {format === 'percentage' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>}
            </div>
        );
    }

    const hasValue = value !== undefined && value !== null;
    return (
        <div
            ref={cellRef}
            tabIndex={0}
            onClick={() => setIsEditing(true)}
            onDoubleClick={() => setIsEditing(true)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsEditing(true);
                }
            }}
            className={`cursor-text px-2 py-1 min-h-[28px] flex items-center transition-colors rounded outline-none focus:ring-2 focus:ring-lime focus:ring-inset focus:bg-lime/5 hover:bg-white/5 ${!hasValue ? 'text-gray-500' : 'text-gray-200'} ${className}`}
        >
            {hasValue 
                ? (format === 'percentage' ? percentFormatter.format(value / 100) : format === 'number' ? value : currencyFormatter.format(value)) 
                : '-'}
        </div>
    );
}
