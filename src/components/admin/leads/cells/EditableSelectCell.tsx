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

    return (
        <Select.Root value={value} onValueChange={onUpdate}>
            <Select.Trigger
                className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors outline-none focus:ring-1 focus:ring-dashboard-accent ${className}`}
            >
                <Select.Value>
                    <span className={selectedOption.color ? `text-${selectedOption.color}-400` : 'text-white'}>
                        {selectedOption.label}
                    </span>
                </Select.Value>
                <Select.Icon>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="z-50 overflow-hidden bg-dashboard-card border border-gray-700 rounded-md shadow-xl min-w-[120px]">
                    <Select.Viewport className="p-1">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className={`relative flex items-center px-4 py-2 text-sm text-gray-300 rounded cursor-pointer select-none outline-none hover:bg-gray-800 hover:text-white data-[highlighted]:bg-gray-800 data-[highlighted]:text-white data-[state=checked]:text-dashboard-accent`}
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
