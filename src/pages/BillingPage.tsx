import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, FileText, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export function BillingPage() {
    const { user } = useAuth()
    const [invoices, setInvoices] = useState<any[]>([])
    const [nativePurchases, setNativePurchases] = useState<any[]>([])
    const [isLoadingBilling, setIsLoadingBilling] = useState(false)

    useEffect(() => {
        if (!user) return

        const fetchBillingData = async () => {
            setIsLoadingBilling(true)
            try {
                // 1. Get manual invoices from profile_data
                const manual = (user.profile_data as any)?.invoices || []
                setInvoices(manual)

                // 2. Get native checkouts from webinar_purchases
                const { data: purchases, error: purchaseErr } = await supabase
                    .from('webinar_purchases')
                    .select('*')
                    .or(`customer_email.ilike.${user.email},user_id.eq.${user.id}`)
                    .in('status', ['completed', 'paid'])
                    .order('created_at', { ascending: false })
                
                if (!purchaseErr && purchases) {
                    setNativePurchases(purchases)
                }
            } catch (err) {
                console.error('Error fetching billing data:', err)
            } finally {
                setIsLoadingBilling(false)
            }
        }

        fetchBillingData()
    }, [user])

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
                <p className="text-gray-400 text-sm mt-1">View your billing history and download manual invoices</p>
            </div>

            <div className="max-w-3xl space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="h-5 w-5 text-lime" />
                        <h2 className="font-heading font-bold text-white">Billing Details</h2>
                    </div>
                    
                    {isLoadingBilling ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 text-lime animate-spin" />
                        </div>
                    ) : invoices.length === 0 && nativePurchases.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl">
                            <FileText className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">No billing history or invoices found.</p>
                            <p className="text-xs text-gray-600 mt-1 font-body">If you recently made a purchase, it will appear here once processed.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Native purchases */}
                            {nativePurchases.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime">Native Checkout History</h3>
                                    <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
                                        {nativePurchases.map((purchase) => (
                                            <div key={purchase.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="min-w-0 flex-1 mr-4">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {Array.isArray(purchase.products) ? purchase.products.join(', ') : 'Sprint Workshop'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Completed on {new Date(purchase.completed_at || purchase.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <span className="text-sm font-mono font-semibold text-lime">
                                                        AED {((purchase.amount_total || 0) / 100).toFixed(2)}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-lime/10 text-lime uppercase tracking-wider">
                                                        {purchase.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manual invoices */}
                            {invoices.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Manual Invoices</h3>
                                    <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
                                        {invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="min-w-0 flex-1 mr-4">
                                                    <a 
                                                        href={inv.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-sm font-medium text-white hover:text-lime hover:underline truncate block"
                                                    >
                                                        {inv.name}
                                                    </a>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Uploaded on {new Date(inv.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    {inv.amount > 0 && (
                                                        <span className="text-sm font-mono font-semibold text-white mr-2">
                                                            AED {inv.amount.toFixed(2)}
                                                        </span>
                                                    )}
                                                    <a
                                                        href={inv.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-border flex items-center gap-1.5 transition cursor-pointer"
                                                    >
                                                        <Download className="h-3 w-3" />
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
