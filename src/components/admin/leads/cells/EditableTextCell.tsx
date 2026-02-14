import { useState, useEffect, useRef } from 'react';

interface EditableTextCellProps {
    value: string;
    onUpdate: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function EditableTextCell({ value, onUpdate, className = '', placeholder = '-' }: EditableTextCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onUpdate(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalValue(value);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-dashboard-bg border border-dashboard-accent rounded px-2 py-1 text-sm text-white focus:outline-none ${className}`}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-white/5 rounded px-2 py-1 min-h-[28px] flex items-center transition-colors ${!value ? 'text-gray-500 italic' : 'text-white'} ${className}`}
        >
            {value || placeholder}
        </div>
    );
}
