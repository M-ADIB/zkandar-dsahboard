import { useState, useEffect, useRef } from 'react';
import { useGridNavigation } from '../hooks/useGridNavigation';

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
    const cellRef = useRef<HTMLDivElement>(null);

    // Apply the navigation hook (listens for arrows on the cellRef)
    // We pass handleEditStart as a callback for when Enter or typing occurs
    useGridNavigation(cellRef, isEditing, (initialChar?: string) => {
        if (initialChar) {
            setLocalValue(initialChar);
            // Wait for next tick so textarea/input has rendered
            setTimeout(() => {
                if (multiline && textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(1, 1);
                } else if (!multiline && inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(1, 1);
                }
            }, 0);
        }
        setIsEditing(true);
    });

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            if (multiline && textareaRef.current) {
                const el = textareaRef.current;
                el.focus();
                // Place cursor at end
                const len = el.value.length;
                el.setSelectionRange(len, len);

                // Auto-expand height to fit content
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
            } else if (!multiline && inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isEditing, multiline]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleBlur = (e?: React.FocusEvent) => {
        // If relatedTarget is inside our cell (like moving from input to something else internally), ignore
        if (e && cellRef.current && cellRef.current.contains(e.relatedTarget as Node)) return;

        setIsEditing(false);
        if (localValue !== value) {
            onUpdate(localValue);
        }
        // Refocus our cell wrapper
        // Optional: comment out if you prefer focus to be lost entirely on external click
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
            setLocalValue(value);
            // Return focus to cell
            requestAnimationFrame(() => cellRef.current?.focus());
            return;
        }

        // Handle Enter/Tab specifically to blur and allow navigation hook to take over, 
        // OR manually move focus ourselves to guarantee Excel-like speed.
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();

            // Excel style: Enter moves Down.
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

            // Excel style: Tab moves Right. Shift+Tab moves Left.
            const td = cellRef.current?.closest('td');
            if (td) {
                const targetTd = e.shiftKey ? td.previousElementSibling : td.nextElementSibling;
                (targetTd?.querySelector('[tabindex="0"]') as HTMLElement)?.focus();
            }
            return;
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <div ref={cellRef} tabIndex={-1} className="w-full relative">
                    <textarea
                        ref={textareaRef}
                        value={localValue}
                        rows={1}
                        onChange={handleTextareaChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-bg-elevated border-2 border-lime rounded-md px-2 py-1 text-sm text-white outline-none resize-none overflow-hidden min-h-[40px] shadow-[0_0_10px_rgba(182,233,65,0.2)] ${className}`}
                        style={{ height: textareaRef.current ? `${textareaRef.current.scrollHeight}px` : 'auto' }}
                    />
                </div>
            );
        }
        return (
            <div ref={cellRef} tabIndex={-1} className="w-full relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-bg-elevated border-2 border-lime rounded-md px-2 py-1 text-sm text-white outline-none shadow-[0_0_10px_rgba(182,233,65,0.2)] ${className}`}
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
            className={`cursor-text px-2 py-1 min-h-[28px] flex items-center transition-colors rounded outline-none focus:ring-2 focus:ring-lime focus:ring-inset focus:bg-lime/5 hover:bg-white/5 group ${!value ? 'text-gray-500 italic' : 'text-gray-200'} ${className}`}
            title={value || undefined}
        >
            <span className={multiline ? 'break-words whitespace-pre-wrap line-clamp-2' : 'truncate max-w-full'}>
                {value || placeholder}
            </span>
        </div>
    );
}
