import { useEffect } from 'react';

/**
 * Handles spreadsheet-like navigation (arrow keys) between elements that have [tabindex="0"]
 * inside a standard HTML table structure (tbody -> tr -> td).
 */
export function useGridNavigation(
    containerRef: React.RefObject<HTMLElement | null>,
    isEditing: boolean,
    onEditStart: (initialValue?: string) => void
) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container || isEditing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if the container itself is focused
            if (document.activeElement !== container) return;

            const td = container.closest('td');
            if (!td) return;
            const tr = td.closest('tr');
            if (!tr) return;
            const tbody = tr.closest('tbody');
            if (!tbody) return;

            const colIndex = Array.from(tr.children).indexOf(td);
            const rowIndex = Array.from(tbody.children).indexOf(tr);

            let targetTd: Element | null | undefined = null;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (rowIndex > 0) {
                        const previousRow = tbody.children[rowIndex - 1];
                        targetTd = previousRow?.children[colIndex];
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (rowIndex < tbody.children.length - 1) {
                        const nextRow = tbody.children[rowIndex + 1];
                        targetTd = nextRow?.children[colIndex];
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    targetTd = td.previousElementSibling;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    targetTd = td.nextElementSibling;
                    break;
                case 'Enter':
                case 'F2':
                    e.preventDefault();
                    onEditStart();
                    return;
                default:
                    // If alphanumeric key typed, enter edit mode immediately with that value
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        // e.preventDefault(); // Don't prevent default, let the input capture the character
                        onEditStart(e.key);
                    }
                    return;
            }

            if (targetTd) {
                const focusableChild = targetTd.querySelector('[tabindex="0"]') as HTMLElement;
                if (focusableChild) {
                    focusableChild.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, containerRef, onEditStart]);
}
