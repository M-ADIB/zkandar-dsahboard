import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

    // For the floating popover
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    // Apply the navigation hook
    useGridNavigation(cellRef, isEditing, (initialChar?: string) => {
        if (initialChar) {
            setLocalValue(initialChar);
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

    // When entering edit mode, compute position for multiline popover
    useEffect(() => {
        if (isEditing && multiline && cellRef.current) {
            const rect = cellRef.current.getBoundingClientRect();
            setPopoverStyle({
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: Math.max(rect.width, 320),
                zIndex: 9999,
            });
        }
    }, [isEditing, multiline]);

    // Auto-size the textarea whenever it renders
    useEffect(() => {
        if (isEditing && multiline && textareaRef.current) {
            const el = textareaRef.current;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
            el.focus();
            const len = el.value.length;
            el.setSelectionRange(len, len);
        } else if (isEditing && !multiline && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing, multiline]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`;
    };

    const handleBlur = (e?: React.FocusEvent) => {
        if (e && cellRef.current && cellRef.current.contains(e.relatedTarget as Node)) return;
        // Also allow clicks inside the portal textarea to not count as blur
        if (e && textareaRef.current && textareaRef.current.contains(e.relatedTarget as Node)) return;

        setIsEditing(false);
        if (localValue !== value) {
            onUpdate(localValue);
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
            setLocalValue(value);
            requestAnimationFrame(() => cellRef.current?.focus());
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey && !multiline) {
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

        // For multiline: Shift+Enter inserts newline (default), plain Enter commits
        if (e.key === 'Enter' && !e.shiftKey && multiline) {
            e.preventDefault();
            setIsEditing(false);
            if (localValue !== value) onUpdate(localValue);
            requestAnimationFrame(() => cellRef.current?.focus());
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

    // Render floating popover editor for multiline cells
    if (isEditing && multiline) {
        return (
            <>
                {/* Show a dim placeholder in the cell itself so layout doesn't shift */}
                <div
                    ref={cellRef}
                    tabIndex={-1}
                    className="w-full px-2 py-1 min-h-[28px] text-lime/40 text-sm italic"
                >
                    Editing…
                </div>

                {/* Floating textarea via portal */}
                {createPortal(
                    <>
                        {/* Backdrop to catch outside clicks */}
                        <div
                            className="fixed inset-0 z-[9998]"
                            onMouseDown={() => {
                                setIsEditing(false);
                                if (localValue !== value) onUpdate(localValue);
                                requestAnimationFrame(() => cellRef.current?.focus());
                            }}
                        />
                        <div style={popoverStyle} className="rounded-lg shadow-2xl ring-2 ring-lime/60 bg-[#111]">
                            <textarea
                                ref={textareaRef}
                                value={localValue}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none resize-none overflow-hidden rounded-lg min-h-[40px]"
                                style={{ height: 'auto' }}
                                placeholder={placeholder}
                            />
                            <div className="px-3 pb-2 flex items-center gap-2 text-[10px] text-gray-600">
                                <span>Enter to save · Shift+Enter for new line · Esc to cancel</span>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
            </>
        );
    }

    if (isEditing) {
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
