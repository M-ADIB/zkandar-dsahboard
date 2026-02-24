import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useGridNavigation } from '../hooks/useGridNavigation';

interface EditableDateCellProps {
    value: string | null;
    onUpdate: (value: string | null) => void;
    className?: string;
}

/**
 * BUG-5 fix: Using T12:00:00 (noon UTC) when parsing date strings avoids the
 * off-by-one-day issue in positive UTC offsets (e.g. UTC+4 / Dubai).
 * Without this, "2024-01-15" parsed as UTC midnight becomes the evening of
 * Jan 14 in a UTC+4 locale, causing dates to display one day early.
 */
function parseLocalDate(dateStr: string): Date {
    // If it looks like a plain YYYY-MM-DD date string, anchor at noon UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'T12:00:00Z');
    }
    // Full ISO string – convert to local date string first then display
    return new Date(dateStr);
}

function toInputValue(isoOrDate: string | null): string {
    if (!isoOrDate) return '';
    const d = parseLocalDate(isoOrDate);
    if (isNaN(d.getTime())) return '';
    // Use local date parts to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function EditableDateCell({ value, onUpdate, className = '' }: EditableDateCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [dateValue, setDateValue] = useState(toInputValue(value));
    const inputRef = useRef<HTMLInputElement>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    useGridNavigation(cellRef, isEditing, (initialChar) => {
        setIsEditing(true);
        // Date inputs don't take freeform text well, so we just focus it
        setTimeout(() => {
            inputRef.current?.focus();
            if (initialChar && /[\d]/i.test(initialChar)) {
                // optional: if they typed a number, let it pass through
            }
        }, 0);
    });

    useEffect(() => {
        setDateValue(toInputValue(value));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = (e?: React.FocusEvent) => {
        if (e && cellRef.current && cellRef.current.contains(e.relatedTarget as Node)) return;
        setIsEditing(false);

        const originalInput = toInputValue(value);
        if (dateValue !== originalInput) {
            if (!dateValue) {
                onUpdate(null);
            } else {
                // Save as noon-UTC ISO string to avoid timezone drift persisted to DB
                const date = new Date(dateValue + 'T12:00:00Z');
                if (!isNaN(date.getTime())) {
                    onUpdate(date.toISOString());
                }
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
            setDateValue(toInputValue(value));
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
            <div ref={cellRef} tabIndex={-1} className="w-full relative">
                <input
                    ref={inputRef}
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-bg-elevated border-2 border-lime rounded-md px-2 py-1 text-white outline-none shadow-[0_0_10px_rgba(182,233,65,0.2)] ${className}`}
                />
            </div>
        );
    }

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
            className={`cursor-text px-2 py-1 flex items-center gap-2 group transition-colors rounded outline-none focus:ring-2 focus:ring-lime focus:ring-inset focus:bg-lime/5 hover:bg-white/5 ${className}`}
        >
            <Calendar className="h-3 w-3 text-gray-500 group-hover:text-lime flex-shrink-0" />
            <span className={dateValue ? 'text-gray-200' : 'text-gray-600 italic truncate'}>
                {dateValue ? parseLocalDate(dateValue).toLocaleDateString() : 'Set Date'}
            </span>
        </div>
    );
}
