import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DollarSign, Plus, Pencil, Trash2, X, Check,
    Briefcase, Cpu, Users as UsersIcon,
    Copy, Eye, EyeOff, Key
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
    { key: 'all', label: 'All', icon: DollarSign },
    { key: 'salary', label: 'Salaries', icon: UsersIcon },
    { key: 'ai_subscription', label: 'Subscriptions', icon: Cpu },
    { key: 'contractor', label: 'External Contractors', icon: Briefcase },
] as const

type Category = 'salary' | 'ai_subscription' | 'contractor'

interface Cost {
    id: string
    item_name: string
    category: Category
    invoice_date: string | null
    total_amount: number
    payment_date: string | null
    notes: string | null
    created_at: string
}

const emptyCost = { item_name: '', category: 'salary' as Category, invoice_date: '', total_amount: 0, payment_date: '', notes: '' }

function CredentialDisplay({ notes }: { notes: string | null }) {
    const [showPass, setShowPass] = useState(false)
    
    if (!notes) return <span className="text-gray-600">—</span>

    // Basic parsing for common patterns
    const email = notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]
    const passMatch = notes.match(/Pass(?:word)?:\s*([^\s|]+)/i) || notes.match(/\|\s*([^\s|]+)/)
    const password = passMatch?.[1]

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="flex flex-col gap-1">
            {email && (
                <div className="flex items-center gap-2 group">
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">{email}</span>
                    <button onClick={() => handleCopy(email)} className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-white">
                        <Copy className="h-3 w-3" />
                    </button>
                </div>
            )}
            {password && (
                <div className="flex items-center gap-2 group">
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        <Key className="h-3 w-3 text-gray-500" />
                        <span className="text-[10px] font-mono text-gray-300">
                            {showPass ? password : '••••••••'}
                        </span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setShowPass(!showPass)} className="p-1 hover:text-white">
                            {showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button onClick={() => handleCopy(password)} className="p-1 hover:text-white">
                            <Copy className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
            {!email && !password && notes && (
                <span className="text-xs text-gray-500 italic max-w-[150px] truncate">{notes}</span>
            )}
        </div>
    )
}

export function CostsPage() {
    const supabase = useSupabase()
    const [costs, setCosts] = useState<Cost[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCost, setEditingCost] = useState<Cost | null>(null)
    const [form, setForm] = useState(emptyCost)
    const [saving, setSaving] = useState(false)

    const fetchCosts = async () => {
        const { data } = await supabase
            .from('costs' as any)
            .select('*')
            .order('created_at', { ascending: false }) as any
        setCosts((data as Cost[]) ?? [])
        setLoading(false)
    }

    useEffect(() => { fetchCosts() }, [])

    const filtered = useMemo(() =>
        filter === 'all' ? costs : costs.filter(c => c.category === filter)
        , [costs, filter])

    const totalCost = useMemo(() =>
        filtered.reduce((s, c) => s + (c.total_amount ?? 0), 0)
        , [filtered])

    const monthlyCost = useMemo(() => {
        const now = new Date()
        const m = now.getMonth()
        const y = now.getFullYear()
        return costs
            .filter(c => {
                if (!c.payment_date) return false
                const d = new Date(c.payment_date)
                return d.getMonth() === m && d.getFullYear() === y
            })
            .reduce((s, c) => s + (c.total_amount ?? 0), 0)
    }, [costs])

    const openAdd = () => {
        setEditingCost(null)
        setForm(emptyCost)
        setModalOpen(true)
    }

    const openEdit = (c: Cost) => {
        setEditingCost(c)
        setForm({
            item_name: c.item_name,
            category: c.category,
            invoice_date: c.invoice_date ?? '',
            total_amount: c.total_amount,
            payment_date: c.payment_date ?? '',
            notes: c.notes ?? '',
        })
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!form.item_name.trim()) { toast.error('Item name is required'); return }
        setSaving(true)
        try {
            const payload = {
                item_name: form.item_name.trim(),
                category: form.category,
                invoice_date: form.invoice_date || null,
                total_amount: Number(form.total_amount) || 0,
                payment_date: form.payment_date || null,
                notes: form.notes || null,
            }
            if (editingCost) {
                const { error } = await (supabase as any).from('costs').update(payload).eq('id', editingCost.id)
                if (error) throw error
                toast.success('Cost updated')
            } else {
                const { error } = await (supabase as any).from('costs').insert(payload)
                if (error) throw error
                toast.success('Cost added')
            }
            setModalOpen(false)
            fetchCosts()
        } catch (err) {
            console.error(err)
            toast.error('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this cost entry?')) return
        const { error } = await (supabase as any).from('costs').delete().eq('id', id)
        if (error) { toast.error('Failed to delete'); return }
        toast.success('Deleted')
        fetchCosts()
    }

    const fmt = (n: number) => n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    const catLabel: Record<string, string> = { salary: 'Salary', ai_subscription: 'Subscription', contractor: 'Contractor' }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Costs</h1>
                    <p className="text-gray-400 text-sm mt-1">Track salaries, subscriptions, and contractor costs</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition text-sm"
                >
                    <Plus className="h-4 w-4" /> Add Cost
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm text-gray-400 mb-1">This Month</p>
                    <p className="text-2xl font-bold text-lime">AED {fmt(monthlyCost)}</p>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm text-gray-400 mb-1">Showing Total</p>
                    <p className="text-2xl font-bold text-white">AED {fmt(totalCost)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${filter === key
                                ? 'bg-lime/10 text-lime border-lime/30'
                                : 'bg-bg-card text-gray-400 border-border hover:border-lime/30 hover:text-white'
                            }`}
                    >
                        <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="px-5 py-3 text-gray-500 font-medium">Item Name</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Category</th>
                                <th className="px-5 py-3 text-gray-500 font-medium whitespace-nowrap">
                                    {filter === 'salary' ? 'Role / Info' : 'Credentials'}
                                </th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Amount</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Payment Date</th>
                                <th className="px-5 py-3 text-gray-500 font-medium w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No cost entries yet</td></tr>
                            ) : filtered.map((cost) => (
                                <tr key={cost.id} className="border-b border-border last:border-0 hover:bg-white/5 transition">
                                    <td className="px-5 py-3">
                                        <div className="text-white font-medium">{cost.item_name}</div>
                                        {cost.notes && <div className="text-xs text-gray-500 mt-0.5">{cost.notes}</div>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="px-2 py-0.5 text-xs rounded-lg border border-lime/20 bg-lime/5 text-lime">
                                            {catLabel[cost.category] ?? cost.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        {cost.category === 'ai_subscription' ? (
                                            <CredentialDisplay notes={cost.notes} />
                                        ) : (
                                            <span className="text-gray-400 text-xs italic truncate max-w-[150px] block">
                                                {cost.notes || fmtDate(cost.invoice_date)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-white font-medium">AED {fmt(cost.total_amount)}</td>
                                    <td className="px-5 py-3 text-gray-400">{fmtDate(cost.payment_date)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(cost)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-lime transition">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(cost.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-bg-elevated border border-border rounded-2xl w-full max-w-md p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">{editingCost ? 'Edit Cost' : 'Add Cost'}</h3>
                                    <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5">Item Name *</label>
                                        <input
                                            value={form.item_name}
                                            onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                                            placeholder="e.g. Midjourney Pro Plan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5">Category *</label>
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}
                                            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                                        >
                                            <option value="salary">Salary</option>
                                            <option value="ai_subscription">Subscription</option>
                                            <option value="contractor">External Contractor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5">Notes (Email, Pass, Info)</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 min-h-[80px]"
                                            placeholder="e.g. login credentials, status..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1.5">Invoice Date</label>
                                            <input
                                                type="date"
                                                value={form.invoice_date}
                                                onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1.5">Payment Date</label>
                                            <input
                                                type="date"
                                                value={form.payment_date}
                                                onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5">Total Amount (AED) *</label>
                                        <input
                                            type="number"
                                            value={form.total_amount}
                                            onChange={e => setForm(p => ({ ...p, total_amount: Number(e.target.value) }))}
                                            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="flex-1 py-2.5 border border-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-500 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="h-4 w-4" />
                                        {saving ? 'Saving...' : editingCost ? 'Update' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
