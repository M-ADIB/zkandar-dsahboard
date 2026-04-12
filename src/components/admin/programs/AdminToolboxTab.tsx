import { useEffect, useRef, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import {
    Plus, Pencil, Trash2, ExternalLink, Wrench, GripVertical
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import type { ToolboxItem } from '@/types/database'
import { ToolboxItemModal } from './ToolboxItemModal'

const importanceBadge = {
    essential: 'bg-red-500/10 text-red-300 border-red-500/30',
    recommended: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    optional: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
}

const toolTypeBadge: Record<string, string> = {
    image_generation: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    video_generation: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    text_generation: 'bg-lime/10 text-lime border-lime/30',
    automation: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    analytics: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    other: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
}

const toolTypeLabel: Record<string, string> = {
    image_generation: 'Image Gen',
    video_generation: 'Video Gen',
    text_generation: 'Text Gen',
    automation: 'Automation',
    analytics: 'Analytics',
    other: 'Other',
}

const visibleToLabel: Record<string, string> = {
    management: 'Mgmt',
    team: 'Team',
    sprint_member: 'Sprint',
}

const visibleToBadge: Record<string, string> = {
    management: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    team: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    sprint_member: 'bg-lime/10 text-lime border-lime/30',
}

// Individual drag-handle row
function DraggableRow({
    item,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
}: {
    item: ToolboxItem
    isSelected: boolean
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    onEdit: () => void
    onDelete: () => void
}) {
    const controls = useDragControls()
    const types = Array.isArray(item.tool_types) && item.tool_types.length > 0
        ? item.tool_types
        : [item.tool_type]
    const visibility = Array.isArray(item.visible_to) ? item.visible_to : []
    const isHidden = visibility.length === 0

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            className={`flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition ${isHidden ? 'opacity-50' : ''} ${isSelected ? 'bg-lime/5' : ''}`}
        >
            {/* Drag handle */}
            <div
                onPointerDown={(e) => controls.start(e)}
                className="shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-gray-400 transition touch-none"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Checkbox */}
            <div className="shrink-0" onClick={e => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                />
            </div>

            {/* Logo */}
            <div className="shrink-0 h-8 w-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center overflow-hidden">
                {item.logo_url ? (
                    <img
                        src={item.logo_url}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                ) : (
                    <span className="text-xs font-bold text-gray-400">{item.title.charAt(0)}</span>
                )}
            </div>

            {/* Title + description */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{item.title}</p>
                {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.description}</p>
                )}
            </div>

            {/* Tool types */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
                {types.slice(0, 2).map(t => (
                    <span key={t} className={`px-1.5 py-0.5 text-[11px] rounded border ${toolTypeBadge[t] ?? toolTypeBadge.other}`}>
                        {toolTypeLabel[t] ?? t}
                    </span>
                ))}
                {types.length > 2 && (
                    <span className="text-xs text-gray-500">+{types.length - 2}</span>
                )}
            </div>

            {/* Visible to */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
                {visibility.length === 0 ? (
                    <span className="px-1.5 py-0.5 text-[11px] rounded border bg-red-500/10 text-red-400 border-red-500/30">Hidden</span>
                ) : (
                    visibility.map(v => (
                        <span key={v} className={`px-1.5 py-0.5 text-[11px] rounded border ${visibleToBadge[v] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                            {visibleToLabel[v] ?? v}
                        </span>
                    ))
                )}
            </div>

            {/* Importance */}
            <div className="shrink-0">
                <span className={`px-1.5 py-0.5 text-[11px] rounded border capitalize ${importanceBadge[item.importance]}`}>
                    {item.importance}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-200 transition">
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button onClick={onEdit}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition">
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={onDelete}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-300 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </Reorder.Item>
    )
}

export function AdminToolboxTab() {
    const supabase = useSupabase()
    const [items, setItems] = useState<ToolboxItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ToolboxItem | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const reorderSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchItems = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('toolbox_items')
            .select('*')
            .order('order_index', { ascending: true })
        setItems((data as ToolboxItem[]) ?? [])
        setLoading(false)
    }

    useEffect(() => { fetchItems() }, [])

    // Called by Reorder.Group when user drags items
    const handleReorder = (newItems: ToolboxItem[]) => {
        setItems(newItems)
        // Debounce DB save
        if (reorderSaveTimer.current) clearTimeout(reorderSaveTimer.current)
        reorderSaveTimer.current = setTimeout(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tbl = supabase.from('toolbox_items') as any
            for (let i = 0; i < newItems.length; i++) {
                await tbl.update({ order_index: i, updated_at: new Date().toISOString() }).eq('id', newItems[i].id)
            }
        }, 600)
    }

    const handleDelete = async (item: ToolboxItem) => {
        if (!confirm(`Delete "${item.title}"?`)) return
        await supabase.from('toolbox_items').delete().eq('id', item.id)
        setItems(prev => prev.filter(i => i.id !== item.id))
    }

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        await supabase.from('toolbox_items').delete().in('id', selectedIds)
        setIsBulkDeleting(false)
        setShowBulkDeleteConfirm(false)
        setSelectedIds([])
        fetchItems()
    }

    const handleBulkEdit = () => {
        const item = items.find((i) => i.id === selectedIds[0])
        if (item) { setSelectedItem(item); setIsModalOpen(true) }
    }

    const allSelected = items.length > 0 && selectedIds.length === items.length
    const someSelected = selectedIds.length > 0 && !allSelected

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIds(e.target.checked ? items.map((i) => i.id) : [])
    }

    const visibleCount = items.filter(i =>
        Array.isArray(i.visible_to) ? i.visible_to.length > 0 : i.is_active
    ).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-lime" />
                        Toolbox Resources
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {items.length} tool{items.length !== 1 ? 's' : ''} · {visibleCount} visible to members
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-elevated border border-border">
                            <span className="text-sm text-gray-400 font-medium">{selectedIds.length} selected</span>
                            <div className="h-4 w-px bg-border" />
                            {selectedIds.length === 1 && (
                                <button
                                    onClick={handleBulkEdit}
                                    className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
                        className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl text-sm font-medium hover:opacity-90 transition"
                    >
                        <Plus className="h-4 w-4" /> Add Tool
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-7 w-7 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                    No tools yet. Click "Add Tool" to get started.
                </div>
            ) : (
                <div className="rounded-2xl border border-border overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-bg-elevated border-b border-border text-xs text-gray-500 uppercase tracking-wider">
                        <div className="w-4 shrink-0" /> {/* grip placeholder */}
                        <div className="shrink-0">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected }}
                                onChange={handleSelectAll}
                                className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                            />
                        </div>
                        <div className="w-8 shrink-0" /> {/* logo placeholder */}
                        <div className="flex-1">Tool</div>
                        <div className="hidden md:block w-28 shrink-0">Types</div>
                        <div className="hidden lg:block w-32 shrink-0">Visible To</div>
                        <div className="w-20 shrink-0">Level</div>
                        <div className="w-20 shrink-0 text-right">Actions</div>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={items}
                        onReorder={handleReorder}
                        className="divide-y divide-border"
                        as="div"
                    >
                        {items.map((item) => (
                            <DraggableRow
                                key={item.id}
                                item={item}
                                isSelected={selectedIds.includes(item.id)}
                                onSelect={(e) => {
                                    e.stopPropagation()
                                    setSelectedIds(prev =>
                                        e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id)
                                    )
                                }}
                                onEdit={() => { setSelectedItem(item); setIsModalOpen(true) }}
                                onDelete={() => handleDelete(item)}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            )}

            <ToolboxItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); fetchItems() }}
                item={selectedItem}
            />

            {/* Bulk delete confirmation */}
            <ModalForm
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                title="Confirm Delete"
                showActions={false}
            >
                <p className="text-gray-300 text-sm">
                    Delete <span className="text-white font-semibold">{selectedIds.length}</span> item{selectedIds.length !== 1 ? 's' : ''}? This cannot be undone.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setShowBulkDeleteConfirm(false)}
                        disabled={isBulkDeleting}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isBulkDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </ModalForm>
        </div>
    )
}
