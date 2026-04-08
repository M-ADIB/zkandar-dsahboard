import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { PageTransition } from './PageTransition'
import { AnimatePresence } from 'framer-motion'
import { Breadcrumbs } from '@/components/shared/Breadcrumb'
import { QuickActionsFAB } from '@/components/shared/QuickActionsFAB'

export function AppShell() {
    const { user } = useAuth()
    const { isPreviewing, canPreview, previewUser, setPreviewUser } = useViewMode()
    const showPreviewBanner = canPreview && isPreviewing

    return (
        <div className="flex min-h-screen bg-bg-primary">
            {/* Sidebar */}
            <Sidebar userRole={user?.role ?? 'participant'} />

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col lg:ml-64">
                {/* Navbar */}
                <Navbar />

                {/* Preview Banner - fixed above content */}
                {showPreviewBanner && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lime/30 bg-lime/10 px-4 py-2 text-xs text-lime">
                        <span>
                            Previewing as: <strong>{previewUser?.full_name ?? 'Member'}</strong>
                            {previewUser?.email && <span className="ml-1 text-lime/60">({previewUser.email})</span>}
                        </span>
                        <button
                            onClick={() => setPreviewUser(null)}
                            className="rounded-lg border border-lime/40 px-3 py-1 text-xs font-medium text-lime hover:border-lime/70"
                        >
                            Exit preview
                        </button>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-x-hidden">
                    <Breadcrumbs />
                    <AnimatePresence mode="wait">
                        <PageTransition>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </main>
            </div>

            {/* Quick Actions FAB */}
            <QuickActionsFAB />
        </div>
    )
}
