import { useState, useEffect, useRef } from 'react';

interface EditableTextCellProps {
    value: string;
    onUpdate: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
}

export function EditableTextCell({
    value,
    onUpdate,
    className = '',
    placeholder = '-',
    multiline = false,
}: EditableTextCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            if (multiline && textareaRef.current) {
                textareaRef.current.focus();
                // Place cursor at end
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
            } else if (!multiline && inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isEditing, multiline]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onUpdate(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalValue(value);
        }
        // For single-line: Enter saves. For multiline: Shift+Enter is newline, Escape cancels.
        if (!multiline && e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={textareaRef}
                    value={localValue}
                    rows={4}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-bg-elevated border border-border rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-lime/60 resize-y min-h-[80px] ${className}`}
                />
            );
        }
        return (
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-bg-elevated border border-border rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-lime/60 ${className}`}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-text px-2 py-1 min-h-[28px] flex items-center transition-colors hover:bg-white/5 rounded group ${!value ? 'text-gray-500 italic' : 'text-gray-200'} ${className}`}
            title={value || undefined}
        >
            <span className={multiline ? 'line-clamp-2' : 'truncate max-w-full'}>
                {value || placeholder}
            </span>
        </div>
    );
}
