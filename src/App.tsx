import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { OwnerDashboard } from '@/pages/OwnerDashboard'
import { ParticipantDashboard } from '@/pages/ParticipantDashboard'
import { SessionsPage } from '@/pages/SessionsPage'
import { AssignmentsPage } from '@/pages/AssignmentsPage'
import { ChatPage } from '@/pages/ChatPage'
import { AnalyticsDashboard } from '@/pages/AnalyticsDashboard'
import { SettingsPage } from '@/pages/SettingsPage'
import { OnboardingSurvey } from '@/components/onboarding/OnboardingSurvey'
import { SprintWorkshopOnboarding } from '@/pages/onboarding/SprintWorkshopOnboarding'

import { NotificationProvider } from '@/context/NotificationContext'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { CompaniesPage } from '@/pages/admin/CompaniesPage'
import { LeadsPage } from '@/pages/admin/LeadsPage'
import { ProgramsPage } from '@/pages/admin/ProgramsPage'
import { ProgramSessionsPage } from '@/pages/admin/ProgramSessionsPage'
import { UsersPage } from '@/pages/admin/UsersPage'

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/signup/:token" element={<SignupPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <AppShell />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard - Role-based redirect */}
                        <Route index element={<DashboardRedirect />} />

                        {/* Owner/Admin Routes */}
                        <Route
                            path="admin"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <OwnerDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/companies"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <CompaniesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/leads"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <LeadsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/programs"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <ProgramsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/programs/:programId/sessions"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <ProgramSessionsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/users"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="analytics"
                            element={
                                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                    <AnalyticsDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Shared Routes (All authenticated users) */}
                        <Route path="dashboard" element={<ParticipantDashboard />} />
                        <Route path="sessions" element={<SessionsPage />} />
                        <Route path="assignments" element={<AssignmentsPage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />

                        {/* Onboarding */}
                        <Route path="onboarding" element={<OnboardingSurvey />} />
                        <Route path="onboarding/sprint-workshop" element={<SprintWorkshopOnboarding />} />
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </NotificationProvider>
        </AuthProvider>
    )
}

// Helper component to redirect based on user role
function DashboardRedirect() {
    const { user, loading } = useAuth()

    if (loading) {
        return null
    }

    // Redirect based on role
    if (user?.role === 'owner' || user?.role === 'admin') {
        return <Navigate to="/admin" replace />
    }

    return <Navigate to="/dashboard" replace />
}

export default App
