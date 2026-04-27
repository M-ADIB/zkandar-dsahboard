import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ViewModeProvider } from '@/context/ViewModeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MemberRoute } from '@/components/auth/MemberRoute'
import { NotificationProvider } from '@/context/NotificationContext'
import { lazy } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageTitleUpdater } from '@/hooks/usePageTitle'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt'
import { SessionExpiryWarning } from '@/components/auth/SessionExpiryWarning'
import { CommandPalette } from '@/components/layout/CommandPalette'

// Public & Onboarding
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('@/pages/SignupPage').then(module => ({ default: module.SignupPage })))
const EventsApplyPage = lazy(() => import('@/pages/public/EventsApplyPage').then(module => ({ default: module.EventsApplyPage })))
const ApplySalesPage = lazy(() => import('@/pages/public/ApplySalesPage').then(module => ({ default: module.ApplySalesPage })))
const WorkflowsPage = lazy(() => import('@/pages/public/WorkflowsPage').then(module => ({ default: module.WorkflowsPage })))
const ProgramPage = lazy(() => import('@/pages/public/ProgramPage').then(module => ({ default: module.ProgramPage })))
const ThankYouPage = lazy(() => import('@/pages/public/ThankYouPage').then(module => ({ default: module.ThankYouPage })))
const LandingPageTest = lazy(() => import('@/pages/public/LandingPageTest').then(module => ({ default: module.LandingPageTest })))
const SubmitFormPage = lazy(() => import('@/pages/public/SubmitFormPage').then(module => ({ default: module.SubmitFormPage })))
const NotSurePage = lazy(() => import('@/pages/public/NotSurePage').then(module => ({ default: module.NotSurePage })))
const FindYourPathPage = lazy(() => import('@/pages/public/FindYourPathPage').then(module => ({ default: module.FindYourPathPage })))
const CheckoutPage = lazy(() => import('@/pages/public/CheckoutPage').then(module => ({ default: module.CheckoutPage })))
const EnrollPage = lazy(() => import('@/pages/public/EnrollPage').then(module => ({ default: module.EnrollPage })))
const CheckoutSuccessPage = lazy(() => import('@/pages/public/CheckoutSuccessPage').then(module => ({ default: module.CheckoutSuccessPage })))
const CaseStudiesPage = lazy(() => import('@/pages/public/CaseStudiesPage').then(module => ({ default: module.CaseStudiesPage })))
const PostCompletionSurvey = lazy(() => import('@/pages/public/PostCompletionSurvey').then(module => ({ default: module.PostCompletionSurvey })))
const PublicPreSurvey = lazy(() => import('@/pages/public/PublicPreSurvey').then(module => ({ default: module.PublicPreSurvey })))
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage').then(module => ({ default: module.TermsOfServicePage })))
const EPKPage = lazy(() => import('@/pages/public/EPKPage').then(module => ({ default: module.EPKPage })))
const OnboardingSurvey = lazy(() => import('@/components/onboarding/OnboardingSurvey').then(module => ({ default: module.OnboardingSurvey })))
const SprintWorkshopOnboarding = lazy(() => import('@/pages/onboarding/SprintWorkshopOnboarding').then(module => ({ default: module.SprintWorkshopOnboarding })))
const WelcomePage = lazy(() => import('@/pages/WelcomePage').then(module => ({ default: module.WelcomePage })))

// Dashboard Pages
const OwnerDashboard = lazy(() => import('@/pages/OwnerDashboard').then(module => ({ default: module.OwnerDashboard })))
const ParticipantDashboard = lazy(() => import('@/pages/ParticipantDashboard').then(module => ({ default: module.ParticipantDashboard })))
const AnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })))
const CompaniesPage = lazy(() => import('@/pages/admin/CompaniesPage').then(module => ({ default: module.CompaniesPage })))
const CompanyWorkspacePage = lazy(() => import('@/pages/admin/CompanyWorkspacePage').then(module => ({ default: module.CompanyWorkspacePage })))
const LeadsPage = lazy(() => import('@/pages/admin/LeadsPage').then(module => ({ default: module.LeadsPage })))
const ProgramsPage = lazy(() => import('@/pages/admin/ProgramsPage').then(module => ({ default: module.ProgramsPage })))
const ProgramDetailPage = lazy(() => import('@/pages/admin/ProgramDetailPage').then(module => ({ default: module.ProgramDetailPage })))
const AdminToolboxPage = lazy(() => import('@/pages/admin/AdminToolboxPage').then(module => ({ default: module.AdminToolboxPage })))
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then(module => ({ default: module.UsersPage })))
const EventsPage = lazy(() => import('@/pages/admin/EventsPage').then(module => ({ default: module.EventsPage })))
const CostsPage = lazy(() => import('@/pages/admin/CostsPage').then(module => ({ default: module.CostsPage })))
const RecruitingPage = lazy(() => import('@/pages/admin/RecruitingPage').then(module => ({ default: module.RecruitingPage })))
const PlatformSettingsPage = lazy(() => import('@/pages/admin/PlatformSettingsPage').then(module => ({ default: module.PlatformSettingsPage })))
const EmailHubPage = lazy(() => import('@/pages/admin/EmailHubPage').then(module => ({ default: module.EmailHubPage })))

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })))

const TestingCredentials = import.meta.env.DEV 
    ? lazy(() => import('@/components/dev/TestingCredentials').then(module => ({ default: module.TestingCredentials })))
    : () => null;

// Shared internal
const ChatPage = lazy(() => import('@/pages/ChatPage').then(module => ({ default: module.ChatPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })))
const MyProgramPage = lazy(() => import('@/pages/MyProgramPage').then(module => ({ default: module.MyProgramPage })))
const MyPerformancePage = lazy(() => import('@/pages/MyPerformancePage').then(module => ({ default: module.MyPerformancePage })))
const ToolboxPage = lazy(() => import('@/pages/ToolboxPage').then(module => ({ default: module.ToolboxPage })))
const ToolboxDetailPage = lazy(() => import('@/pages/ToolboxDetailPage').then(module => ({ default: module.ToolboxDetailPage })))
const AssignmentsPage = lazy(() => import('@/pages/AssignmentsPage').then(module => ({ default: module.AssignmentsPage })))
const RecordingsPage = lazy(() => import('@/pages/RecordingsPage').then(module => ({ default: module.RecordingsPage })))

const MARKETING_DOMAIN = ['zkandar.com', 'www.zkandar.com']
const isMarketingDomain = MARKETING_DOMAIN.includes(window.location.hostname)

function App() {
    return (
        <AuthProvider>
            <ViewModeProvider>
                <NotificationProvider>
                    <ErrorBoundary>
                        <Suspense fallback={
                            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                            </div>
                        }>
                            <PageTitleUpdater />
                            <SessionExpiryWarning />
                            <CommandPalette />
                            <InstallPrompt />
                            <UpdatePrompt />
                            {import.meta.env.DEV && <TestingCredentials />}
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="/signup/:token" element={<SignupPage />} />
                                <Route path="/events-apply" element={<EventsApplyPage />} />
                                <Route path="/apply/sales" element={<ApplySalesPage />} />
                                <Route path="/masterclass-analytics" element={<WorkflowsPage />} />
                                <Route path="/program" element={<ProgramPage />} />
                                <Route path="/thank-you" element={<ThankYouPage />} />
                                <Route path="/test-landingpage" element={<LandingPageTest />} />
                                <Route path="/submit-form" element={<SubmitFormPage />} />
                                <Route path="/not-sure" element={<NotSurePage />} />
                                <Route path="/case-studies" element={<CaseStudiesPage />} />
                                <Route path="/find-your-path" element={<FindYourPathPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/enroll" element={<EnrollPage />} />
                                <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                                <Route path="/survey/post-completion" element={<PostCompletionSurvey />} />
                                <Route path="/survey/pre-completion" element={<PublicPreSurvey />} />
                                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                                <Route path="/terms" element={<TermsOfServicePage />} />
                                <Route path="/epk/:slug" element={<EPKPage />} />

                                {/* Onboarding (full-screen) */}
                                <Route
                                    path="/onboarding"
                                    element={
                                        <ProtectedRoute>
                                            <OnboardingSurvey />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/onboarding/sprint-workshop"
                                    element={
                                        <ProtectedRoute>
                                            <SprintWorkshopOnboarding />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Welcome Video (post-onboarding gate) */}
                                <Route
                                    path="/welcome"
                                    element={
                                        <ProtectedRoute>
                                            <WelcomePage />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Protected Routes */}
                                <Route
                                    path="/"
                                    element={isMarketingDomain
                                        ? <LandingPageTest />
                                        : <ProtectedRoute><AppShell /></ProtectedRoute>
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
                                        path="admin/companies/:id"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <CompanyWorkspacePage />
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
                                        path="admin/programs/:id"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <ProgramDetailPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/toolbox"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <AdminToolboxPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/members"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <UsersPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/events"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <EventsPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/costs"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <CostsPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/recruiting"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <RecruitingPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/chat"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <ChatPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/settings"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <PlatformSettingsPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/analytics"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <AnalyticsDashboard />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="admin/email"
                                        element={
                                            <ProtectedRoute allowedRoles={['owner', 'admin']}>
                                                <EmailHubPage />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Shared Routes (All authenticated users) */}
                                    <Route
                                        path="dashboard"
                                        element={
                                            <MemberRoute>
                                                <ParticipantDashboard />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="chat"
                                        element={
                                            <MemberRoute>
                                                <ChatPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="my-program"
                                        element={
                                            <MemberRoute>
                                                <MyProgramPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="assignments"
                                        element={
                                            <MemberRoute>
                                                <AssignmentsPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="recordings"
                                        element={
                                            <MemberRoute>
                                                <RecordingsPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="my-performance"
                                        element={
                                            <MemberRoute>
                                                <MyPerformancePage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="toolbox"
                                        element={
                                            <MemberRoute>
                                                <ToolboxPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route
                                        path="toolbox/:id"
                                        element={
                                            <MemberRoute>
                                                <ToolboxDetailPage />
                                            </MemberRoute>
                                        }
                                    />
                                    <Route path="settings" element={<SettingsPage />} />
                                    <Route path="notifications" element={<NotificationsPage />} />

                                </Route>

                                {/* Catch all */}
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </NotificationProvider>
            </ViewModeProvider>
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
