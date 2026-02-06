import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
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

function App() {
    return (
        <AuthProvider>
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

                    {/* Onboarding */}
                    <Route path="onboarding" element={<OnboardingSurvey />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    )
}

// Helper component to redirect based on user role
function DashboardRedirect() {
    // This will be implemented with auth context
    // For now, redirect to participant dashboard
    return <Navigate to="/dashboard" replace />
}

export default App
