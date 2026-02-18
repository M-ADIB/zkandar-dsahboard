import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface EditableDateCellProps {
    value: string | null;
    onUpdate: (value: string | null) => void;
    className?: string;
}

export function EditableDateCell({ value, onUpdate, className = '' }: EditableDateCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [dateValue, setDateValue] = useState(value ? new Date(value).toISOString().split('T')[0] : '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDateValue(value ? new Date(value).toISOString().split('T')[0] : '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (dateValue === (value ? new Date(value).toISOString().split('T')[0] : '')) return;

        // If empty, set null
        if (!dateValue) {
            onUpdate(null);
            return;
        }

        // Convert to ISO string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            onUpdate(date.toISOString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setDateValue(value ? new Date(value).toISOString().split('T')[0] : '');
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
            <Calendar className="h-3 w-3 text-gray-500 group-hover:text-lime" />
            <span className={dateValue ? 'text-gray-200' : 'text-gray-600 italic'}>
                {dateValue ? new Date(dateValue).toLocaleDateString() : 'Set Date'}
            </span>
        </div>
    );
}
