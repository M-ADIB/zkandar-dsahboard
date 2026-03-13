import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Pencil, Trash2, X, Check,
    Copy, Eye, EyeOff, Key, Settings, AlertCircle, Calendar
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import toast from 'react-hot-toast'

interface CostCategory {
    id: string
    name: string
    color: string
    created_at: string
}

interface Cost {
    id: string
    item_name: string
    category: string
    invoice_date: string | null
    total_amount: number
    payment_date: string | null
    notes: string | null
    credential_email?: string | null
    credential_password?: string | null
    is_active: boolean
    created_at: string
}

const emptyCost: Omit<Cost, 'id' | 'created_at'> = { 
    item_name: '', 
    category: 'Salary', 
    invoice_date: '', 
    total_amount: 0, 
    payment_date: '', 
    notes: '',
    credential_email: '',
    credential_password: '',
    is_active: true
}

type TimeFilter = 'this_month' | 'last_month' | 'past_90' | 'upcoming'
type StatusFilter = 'all' | 'active' | 'inactive'

function CredentialDisplay({ email, password, notes }: { email?: string | null, password?: string | null, notes?: string | null }) {
    const [showPass, setShowPass] = useState(false)
    
    if (!email && !password && !notes) return <span className="text-gray-600">—</span>

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
    const [categories, setCategories] = useState<CostCategory[]>([])
    const [loading, setLoading] = useState(true)
    
    // Filters
    const [categoryFilter, setCategoryFilter] = useState('all') // 'all' or category name
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_month')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

    // Modals & Forms
    const [modalOpen, setModalOpen] = useState(false)
    const [categoriesModalOpen, setCategoriesModalOpen] = useState(false)
    const [editingCost, setEditingCost] = useState<Cost | null>(null)
    const [form, setForm] = useState(emptyCost)
    const [saving, setSaving] = useState(false)

    // Category CRUD state
    const [newCatName, setNewCatName] = useState('')
    const [newCatColor, setNewCatColor] = useState('#D0FF71')
    const [addingCat, setAddingCat] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const [costsRes, catsRes] = await Promise.all([
            (supabase as any).from('costs').select('*').order('created_at', { ascending: false }),
            (supabase as any).from('cost_categories').select('*').order('created_at', { ascending: true })
        ])
        
        setCosts((costsRes.data as Cost[]) ?? [])
        setCategories((catsRes.data as CostCategory[]) ?? [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    // --- Derived Data ---

    const filteredCosts = useMemo(() => {
        let result = costs

        // 1. Status Filter
        if (statusFilter === 'active') result = result.filter(c => c.is_active)
        else if (statusFilter === 'inactive') result = result.filter(c => !c.is_active)

        // 2. Category Filter
        if (categoryFilter !== 'all') result = result.filter(c => c.category === categoryFilter)

        // 3. Time Filter
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        result = result.map(c => {
            // If item is active and has a past payment date, calculate its rolled-forward date
            // The logic: roll the month forward to the current month or next month if already passed this month
            let displayDate = c.payment_date
            
            if (c.is_active && c.payment_date) {
                const originalDate = new Date(c.payment_date)
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                
                // Only roll forward if the original date is in the past
                if (originalDate < today) {
                    const rolledDate = new Date(originalDate.getTime())
                    // Set it to current month/year
                    rolledDate.setFullYear(currentYear)
                    rolledDate.setMonth(currentMonth)
                    
                    // If the rolled date in current month is still in the past (e.g., today is 15th, payment is 1st),
                    // roll it to next month
                    if (rolledDate < today) {
                        rolledDate.setMonth(currentMonth + 1)
                    }
                    
                    // Format correctly as string YYYY-MM-DD to preserve local timezone rendering
                    displayDate = `${rolledDate.getFullYear()}-${String(rolledDate.getMonth() + 1).padStart(2, '0')}-${String(rolledDate.getDate()).padStart(2, '0')}`
                }
            }
            
            return {
                ...c,
                display_payment_date: displayDate
            }
        })
        
        result = result.filter(c => {
            // Now filter using display_payment_date instead of payment_date
            if (!c.display_payment_date) {
                const dateToUse = c.display_payment_date || c.invoice_date || c.created_at
                const d = new Date(dateToUse)
                
                if (timeFilter === 'this_month') {
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
                }
                if (timeFilter === 'last_month') {
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
                    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
                }
                if (timeFilter === 'past_90') {
                    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                    return d >= ninetyDaysAgo && d <= now
                }
                if (timeFilter === 'upcoming') {
                    return false // if no payment date, it can't be upcoming
                }
                return true
            }

            const d = new Date(c.display_payment_date)
            // Strip time from 'now' for precise 'upcoming' check
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            
            if (timeFilter === 'this_month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear
            }
            if (timeFilter === 'last_month') {
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
            }
            if (timeFilter === 'past_90') {
                const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                return d >= ninetyDaysAgo && d <= now
            }
            if (timeFilter === 'upcoming') {
                return d > today
            }
            return true
        })

        return result
    }, [costs, categoryFilter, timeFilter, statusFilter])

    const periodTotal = useMemo(() => 
        filteredCosts.reduce((s, c) => s + (c.total_amount ?? 0), 0)
    , [filteredCosts])

    const allTimeTotal = useMemo(() => 
        costs.reduce((s, c) => s + (c.total_amount ?? 0), 0)
    , [costs])

    // --- Handlers ---

    const openAdd = () => {
        setEditingCost(null)
        setForm({
            ...emptyCost,
            category: categories.length > 0 ? categories[0].name : 'Salary'
        })
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
            credential_email: c.credential_email ?? '',
            credential_password: c.credential_password ?? '',
            is_active: c.is_active
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
                credential_email: form.credential_email || null,
                credential_password: form.credential_password || null,
                is_active: form.is_active
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
            fetchData()
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
        
        // Optimistic update
        setCosts(prev => prev.filter(c => c.id !== id))
    }

    const handleToggleActive = async (cost: Cost) => {
        const newValue = !cost.is_active
        
        // Optimistic update
        setCosts(prev => prev.map(c => c.id === cost.id ? { ...c, is_active: newValue } : c))
        
        const { error } = await (supabase as any).from('costs').update({ is_active: newValue }).eq('id', cost.id)
        if (error) {
            toast.error('Failed to update status')
            // Revert on error
            setCosts(prev => prev.map(c => c.id === cost.id ? { ...c, is_active: !newValue } : c))
        }
    }

    // --- Category CRUD ---
    const handleAddCategory = async () => {
        if (!newCatName.trim()) return
        setAddingCat(true)
        try {
            const { data, error } = await (supabase as any).from('cost_categories').insert({
                name: newCatName.trim(),
                color: newCatColor
            }).select().single()
            
            if (error) throw error
            setCategories(prev => [...prev, data])
            setNewCatName('')
            toast.success('Category added')
        } catch (err) {
            console.error(err)
            toast.error('Failed to add category (Name must be unique)')
        } finally {
            setAddingCat(false)
        }
    }

    const handleDeleteCategory = async (cat: CostCategory) => {
        const inUseCount = costs.filter(c => c.category === cat.name).length
        if (inUseCount > 0) {
            toast.error(`Cannot delete: ${inUseCount} costs are using this category.`)
            return
        }
        
        if (!confirm(`Delete category "${cat.name}"?`)) return
        
        const { error } = await (supabase as any).from('cost_categories').delete().eq('id', cat.id)
        if (error) { toast.error('Failed to delete category'); return }
        
        setCategories(prev => prev.filter(c => c.id !== cat.id))
        if (categoryFilter === cat.name) setCategoryFilter('all')
        toast.success('Category deleted')
    }

    const handleUpdateCategoryColor = async (id: string, newColor: string) => {
        // Optimistic
        setCategories(prev => prev.map(c => c.id === id ? { ...c, color: newColor } : c))
        await (supabase as any).from('cost_categories').update({ color: newColor }).eq('id', id)
    }
    
    const handleUpdateCategoryName = async (cat: CostCategory, newName: string) => {
        if (!newName.trim() || newName === cat.name) return
        
        try {
            // First update the category
            const { error: catErr } = await (supabase as any).from('cost_categories').update({ name: newName }).eq('id', cat.id)
            if (catErr) throw catErr
            
            // Then update any linked costs
            const costsToUpdate = costs.filter(c => c.category === cat.name)
            if (costsToUpdate.length > 0) {
                await (supabase as any).from('costs').update({ category: newName }).eq('category', cat.name)
            }
            
            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c))
            setCosts(prev => prev.map(c => c.category === cat.name ? { ...c, category: newName } : c))
            
            if (categoryFilter === cat.name) setCategoryFilter('all')
            
            toast.success('Category renamed')
        } catch(err) {
            console.error(err)
            toast.error('Failed to rename category')
        }
    }

    // --- Formatting ---
    const fmt = (n: number) => n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    
    // Get color for category badge
    const getCatColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        return cat?.color || '#D0FF71'
    }

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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCategoriesModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border text-white font-medium rounded-xl hover:border-lime/50 hover:text-lime transition text-sm"
                    >
                        <Settings className="h-4 w-4" /> Manage Categories
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition text-sm"
                    >
                        <Plus className="h-4 w-4" /> Add Cost
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bg-card border border-border p-4 rounded-2xl">
                
                {/* Time Filters */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 w-max overflow-x-auto">
                    {(['this_month', 'last_month', 'past_90', 'upcoming'] as TimeFilter[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeFilter(t)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                                timeFilter === t 
                                ? 'bg-white/10 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {t === 'this_month' ? 'This Month' :
                             t === 'last_month' ? 'Last Month' :
                             t === 'past_90' ? 'Past 90 Days' : 'Upcoming'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 border-r border-border pr-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-bg-card">All Status</option>
                            <option value="active" className="bg-bg-card">Active Only</option>
                            <option value="inactive" className="bg-bg-card">Inactive Only</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Category</span>
                        <select 
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer max-w-[150px] truncate"
                        >
                            <option value="all" className="bg-bg-card">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name} className="bg-bg-card">{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm text-gray-400 mb-1">
                        {timeFilter === 'this_month' ? 'This Month' :
                         timeFilter === 'last_month' ? 'Last Month' :
                         timeFilter === 'past_90' ? 'Past 90 Days' : 'Upcoming'}
                    </p>
                    <p className="text-2xl font-bold text-lime">AED {fmt(periodTotal)}</p>
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm text-gray-400 mb-1">Showing Total</p>
                    <p className="text-2xl font-bold text-white">AED {fmt(allTimeTotal)}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="px-5 py-3 text-gray-500 font-medium whitespace-nowrap">Active</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Item Name</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Category</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Credentials / Info</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Amount</th>
                                <th className="px-5 py-3 text-gray-500 font-medium">Payment Date</th>
                                <th className="px-5 py-3 text-gray-500 font-medium w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCosts.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">No cost entries match the filters.</td></tr>
                            ) : filteredCosts.map((cost) => (
                                <tr key={cost.id} className={`border-b border-border last:border-0 hover:bg-white/5 transition ${!cost.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3 align-middle w-16">
                                        <button 
                                            onClick={() => handleToggleActive(cost)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none block ${cost.is_active ? 'bg-lime' : 'bg-gray-700'}`}
                                        >
                                            <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 left-[2px] h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${cost.is_active ? 'translate-x-[14px]' : 'translate-x-0 bg-white'}`} />
                                        </button>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-white font-medium">{cost.item_name}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span 
                                            className="px-2 py-0.5 text-xs rounded-lg border bg-opacity-10 whitespace-nowrap"
                                            style={{ 
                                                color: getCatColor(cost.category),
                                                borderColor: `${getCatColor(cost.category)}40`,
                                                backgroundColor: `${getCatColor(cost.category)}10`
                                            }}
                                        >
                                            {cost.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <CredentialDisplay 
                                            email={cost.credential_email} 
                                            password={cost.credential_password} 
                                            notes={cost.notes} 
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-white font-medium">AED {fmt(cost.total_amount)}</td>
                                    <td className="px-5 py-3 text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className={`h-3 w-3 ${cost.is_active && (cost as any).display_payment_date !== cost.payment_date ? 'text-lime' : 'text-gray-500'}`}/> 
                                            <span className={cost.is_active && (cost as any).display_payment_date !== cost.payment_date ? 'text-lime' : ''}>
                                                {fmtDate((cost as any).display_payment_date)}
                                            </span>
                                            {cost.is_active && (cost as any).display_payment_date !== cost.payment_date && (
                                                <span className="text-[10px] bg-lime/10 text-lime px-1.5 py-0.5 rounded ml-1 border border-lime/20">Recurring</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openEdit(cost)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(cost.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editing / Adding Cost Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        >
                            <div className="bg-bg-elevated border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between sticky top-0 bg-bg-elevated z-10 pb-2 border-b border-border/50">
                                    <h3 className="text-lg font-bold text-white">{editingCost ? 'Edit Cost' : 'Add Cost'}</h3>
                                    <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-medium text-white">Active Status</p>
                                            <p className="text-xs text-gray-400">Is this an ongoing/active cost?</p>
                                        </div>
                                        <button 
                                            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none block ${form.is_active ? 'bg-lime' : 'bg-gray-700'}`}
                                        >
                                            <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 left-[2px] h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-5' : 'translate-x-0 bg-white'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Item Name *</label>
                                            <input
                                                value={form.item_name}
                                                onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white placeholder-gray-600"
                                                placeholder="e.g. Midjourney Pro Plan"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Category *</label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white appearance-none"
                                            >
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-border bg-black/20 space-y-4">
                                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                            <Key className="h-4 w-4 text-lime"/> Credentials
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs text-gray-400 mb-1.5">Username / Email</label>
                                                <input
                                                    value={form.credential_email || ''}
                                                    onChange={e => setForm(p => ({ ...p, credential_email: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-black border border-border rounded-lg text-sm focus:outline-none focus:border-lime/50 text-white placeholder-gray-600"
                                                    placeholder="admin@zkandar.com"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <label className="block text-xs text-gray-400">Password</label>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={form.credential_password || ''}
                                                        onChange={e => setForm(p => ({ ...p, credential_password: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-black border border-border rounded-lg text-sm focus:outline-none focus:border-lime/50 text-white font-mono placeholder-gray-600"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">General Notes</label>
                                        <textarea
                                            value={form.notes || ''}
                                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 min-h-[60px] text-white placeholder-gray-600"
                                            placeholder="Links, details, context..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Invoice Date</label>
                                            <input
                                                type="date"
                                                value={form.invoice_date || ''}
                                                onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Payment Date</label>
                                            <input
                                                type="date"
                                                value={form.payment_date || ''}
                                                onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Total Amount (AED) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">AED</span>
                                            <input
                                                type="number"
                                                value={form.total_amount || ''}
                                                onChange={e => setForm(p => ({ ...p, total_amount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                                                className="w-full pl-12 pr-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-border/50">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="flex-1 py-2.5 bg-transparent border border-border rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-500 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-2.5 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="h-4 w-4" />
                                        {saving ? 'Saving...' : editingCost ? 'Update Cost' : 'Add Cost'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Manage Categories Modal */}
            <AnimatePresence>
                {categoriesModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setCategoriesModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        >
                            <div className="bg-bg-elevated border border-border rounded-2xl w-full max-w-md p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-lime"/> Manage Categories
                                    </h3>
                                    <button onClick={() => setCategoriesModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Add New Category */}
                                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 mb-6">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Add New Category</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newCatColor}
                                            onChange={e => setNewCatColor(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-1 shrink-0"
                                        />
                                        <input
                                            value={newCatName}
                                            onChange={e => setNewCatName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                            placeholder="Category Name"
                                            className="w-full px-3 py-2 bg-black border border-border rounded-lg text-sm text-white focus:outline-none focus:border-lime/50"
                                        />
                                        <button 
                                            onClick={handleAddCategory}
                                            disabled={addingCat || !newCatName.trim()}
                                            className="p-2.5 bg-lime text-black rounded-lg hover:opacity-90 disabled:opacity-50 transition shrink-0"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* List Categories */}
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                    {categories.length === 0 ? (
                                        <p className="text-center text-gray-500 text-sm py-4">No categories created.</p>
                                    ) : categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 bg-bg-card border border-border rounded-xl group">
                                            <div className="flex items-center gap-3 flex-1 mr-3">
                                                <input
                                                    type="color"
                                                    value={cat.color}
                                                    onChange={e => handleUpdateCategoryColor(cat.id, e.target.value)}
                                                    className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-0 p-0.5 shrink-0"
                                                />
                                                <input
                                                    value={cat.name}
                                                    onChange={e => handleUpdateCategoryName(cat, e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-lime/50 text-sm text-white px-1 py-1 transition-colors"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition"
                                                title={`Delete ${cat.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="pt-2">
                                    <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-200">
                                            Categories color-code your expenses and allow filtering. Deleting a category is restricted if expenses are currently assigned to it.
                                        </p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => setCategoriesModalOpen(false)}
                                    className="w-full py-2.5 border border-border rounded-xl text-sm text-white hover:bg-white/5 transition mt-4"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
