import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    color?: string;
}

interface EditableSelectCellProps {
    value: string;
    options: Option[];
    onUpdate: (value: string) => void;
    className?: string;
}

export function EditableSelectCell({ value, options, onUpdate, className = '' }: EditableSelectCellProps) {
    const selectedOption = options.find(o => o.value === value) || { value: value, label: value };
    const colorMap: Record<string, string> = {
        lime: 'text-lime',
        red: 'text-red-300',
        orange: 'text-orange-300',
        green: 'text-green-300',
        gray: 'text-gray-300',
    };
    const colorClass = selectedOption.color ? (colorMap[selectedOption.color] || 'text-gray-200') : 'text-gray-200';

    return (
        <Select.Root value={value} onValueChange={onUpdate}>
            <Select.Trigger
                className={`group inline-flex items-center gap-2 px-1 py-0.5 text-sm text-gray-200 hover:text-white transition-colors outline-none focus:ring-0 ${className}`}
            >
                <Select.Value>
                    <span className={colorClass}>
                        {selectedOption.label}
                    </span>
                </Select.Value>
                <Select.Icon>
                    <ChevronDown className="h-3 w-3 text-gray-500 opacity-60 group-hover:opacity-100" />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="z-50 overflow-hidden bg-bg-elevated border border-border rounded-md shadow-xl min-w-[140px]">
                    <Select.Viewport className="p-1">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className="relative flex items-center px-3 py-2 text-sm text-gray-200 rounded cursor-pointer select-none outline-none hover:bg-white/5 data-[highlighted]:bg-white/10 data-[state=checked]:text-lime"
                            >
                                <Select.ItemText>{option.label}</Select.ItemText>
                                <Select.ItemIndicator className="absolute left-1">
                                    <Check className="h-3 w-3" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}
