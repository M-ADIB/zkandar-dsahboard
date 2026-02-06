import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuth } from '@/context/AuthContext'

export function AppShell() {
    const { user } = useAuth()

    return (
        <div className="flex min-h-screen bg-bg-primary">
            {/* Sidebar */}
            <Sidebar userRole={user?.role ?? 'participant'} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
