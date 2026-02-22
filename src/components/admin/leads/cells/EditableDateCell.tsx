import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

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

    useEffect(() => {
        setDateValue(toInputValue(value));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const originalInput = toInputValue(value);
        if (dateValue === originalInput) return;

        if (!dateValue) {
            onUpdate(null);
            return;
        }

        // Save as noon-UTC ISO string to avoid timezone drift persisted to DB
        const date = new Date(dateValue + 'T12:00:00Z');
        if (!isNaN(date.getTime())) {
            onUpdate(date.toISOString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setDateValue(toInputValue(value));
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-bg-elevated border border-border rounded-md px-2 py-1 text-white focus:outline-none focus:border-lime/60 ${className}`}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-text px-2 py-1 rounded flex items-center gap-2 group hover:bg-white/5 ${className}`}
        >
            <Calendar className="h-3 w-3 text-gray-500 group-hover:text-lime flex-shrink-0" />
            <span className={dateValue ? 'text-gray-200' : 'text-gray-600 italic'}>
                {dateValue ? parseLocalDate(dateValue).toLocaleDateString() : 'Set Date'}
            </span>
        </div>
    );
}
