import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Plus, Pencil, Trash2, ExternalLink, ToggleLeft, ToggleRight, Wrench
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

const toolTypeBadge = {
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

export function AdminToolboxTab() {
    const supabase = useSupabase()
    const [items, setItems] = useState<ToolboxItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ToolboxItem | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

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

    const handleToggleActive = async (item: ToolboxItem) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('toolbox_items') as any)
            .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
            .eq('id', item.id)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
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

    const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        e.stopPropagation()
        setSelectedIds(prev =>
            e.target.checked ? [...prev, id] : prev.filter(sid => sid !== id)
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-lime" />
                        Toolbox Resources
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {items.length} tool{items.length !== 1 ? 's' : ''} · {items.filter(i => i.is_active).length} active
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
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-bg-elevated border-b border-border text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected }}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                                    />
                                </th>
                                <th className="text-left px-5 py-3">Tool</th>
                                <th className="text-left px-5 py-3">Category</th>
                                <th className="text-left px-5 py-3">Type</th>
                                <th className="text-left px-5 py-3">Importance</th>
                                <th className="text-center px-5 py-3">Active</th>
                                <th className="text-right px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item, i) => {
                                const isSelected = selectedIds.includes(item.id)
                                return (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`hover:bg-white/[0.02] transition ${!item.is_active ? 'opacity-50' : ''} ${isSelected ? 'bg-lime/5' : ''}`}
                                    >
                                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectRow(e, item.id)}
                                                className="h-4 w-4 rounded border-border bg-bg-elevated accent-lime cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-medium text-white">{item.title}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{item.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400">{item.category}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 text-xs rounded-lg border ${toolTypeBadge[item.tool_type]}`}>
                                                {toolTypeLabel[item.tool_type]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 text-xs rounded-lg border capitalize ${importanceBadge[item.importance]}`}>
                                                {item.importance}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button onClick={() => handleToggleActive(item)} className="mx-auto block">
                                                {item.is_active
                                                    ? <ToggleRight className="h-5 w-5 text-lime" />
                                                    : <ToggleLeft className="h-5 w-5 text-gray-500" />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-200 transition">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                <button onClick={() => { setSelectedItem(item); setIsModalOpen(true) }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-300 transition">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
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
