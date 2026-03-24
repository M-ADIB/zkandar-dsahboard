import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
    label: string;
    value: string;           // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
    onChange: (value: string) => void;
    required?: boolean;
    showTime?: boolean;
    className?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function DateTimePicker({ label, value, onChange, required, showTime = false, className = '' }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse value
    const dateStr = value?.split('T')[0] || '';
    const timeStr = value?.includes('T') ? value.split('T')[1]?.substring(0, 5) : '';

    const selectedDate = dateStr ? new Date(dateStr + 'T00:00:00') : null;

    const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? new Date().getMonth());

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const daysInMonth = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days: (number | null)[] = [];
        for (let i = 0; i < startPadding; i++) days.push(null);
        for (let i = 1; i <= totalDays; i++) days.push(i);
        return days;
    }, [viewYear, viewMonth]);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const handleDayClick = (day: number) => {
        const newDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (showTime && timeStr) {
            onChange(`${newDate}T${timeStr}`);
        } else if (showTime) {
            onChange(`${newDate}T09:00`);
        } else {
            onChange(newDate);
        }
        if (!showTime) setIsOpen(false);
    };

    const handleTimeChange = (newTime: string) => {
        if (dateStr) {
            onChange(`${dateStr}T${newTime}`);
        }
    };

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(y => y - 1);
        } else {
            setViewMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(y => y + 1);
        } else {
            setViewMonth(m => m + 1);
        }
    };

    const displayValue = (() => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        let str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (showTime && timeStr) str += ` at ${timeStr}`;
        return str;
    })();

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>

            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-left text-sm transition-all hover:bg-white/[0.05] focus:outline-none focus:border-lime/40 focus:bg-white/[0.05]"
            >
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <span className={displayValue ? 'text-white' : 'text-gray-500'}>
                    {displayValue || 'Select date...'}
                </span>
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-4 space-y-3 animate-in fade-in-0 zoom-in-95">
                    {/* Month/Year header */}
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-white">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[10px] text-gray-600 font-medium py-0.5">{d}</div>
                        ))}

                        {/* Day cells */}
                        {daysInMonth.map((day, idx) => {
                            if (day === null) return <div key={`pad-${idx}`} />;

                            const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = dayStr === dateStr;
                            const isToday = dayStr === todayStr;

                            return (
                                <button
                                    key={dayStr}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                        isSelected
                                            ? 'bg-lime text-black font-bold shadow-[0_0_12px_rgba(208,255,113,0.3)]'
                                            : isToday
                                            ? 'bg-white/10 text-lime font-semibold'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time picker */}
                    {showTime && dateStr && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                            <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="text-xs text-gray-400 shrink-0">Time:</span>
                            <input
                                type="time"
                                value={timeStr || '09:00'}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-lime/40 [color-scheme:dark]"
                            />
                        </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                const t = new Date();
                                setViewYear(t.getFullYear());
                                setViewMonth(t.getMonth());
                                handleDayClick(t.getDate());
                            }}
                            className="px-2 py-1 text-[10px] text-gray-500 hover:text-lime hover:bg-lime/5 rounded-md transition uppercase tracking-wider"
                        >
                            Today
                        </button>
                        {dateStr && (
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-md transition uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
