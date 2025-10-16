import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import AdminLogin from './pages/auth/AdminLogin'
import { Dashboard } from './pages/Dashboard'
import { NewReport } from './pages/NewReport'
import { MyReports } from './pages/MyReports'
import { ReportEditor } from './pages/ReportEditor'
import { DraftViewer } from './pages/DraftViewer'
import { ReportViewer } from './pages/ReportViewer'
import { Feedback } from './pages/Feedback'
import { PaymentsPlans } from './pages/PaymentsPlans'
import { Settings } from './pages/Settings'
import { FeedbackSupport } from './pages/FeedbackSupport'
import { About } from './pages/About'
import { TermsOfService } from './pages/TermsOfService'
import { PrivacyPolicy } from './pages/PrivacyPolicy'

import { Contact } from './pages/Contact'
import LabReportGuide from './pages/LabReportGuide'
import SeeSciDraftInAction from './pages/SeeSciDraftInAction'
// Admin Components
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminReports } from './pages/admin/AdminReports'
import AdminPayments from './pages/admin/AdminPayments'
import { AdminFeedback } from './pages/admin/AdminFeedback'
import { AdminPrompts } from './pages/admin/AdminPrompts'
import { AdminAdmins } from './pages/admin/AdminAdmins'
import { AdminNotifications } from './pages/admin/AdminNotifications'
import { AdminSystemSettings } from './pages/admin/AdminSystemSettings'
import AdminReportDetails from './pages/admin/AdminReportDetails'

import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function ProtectedRoute({ children, requireAuth = true }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (requireAuth && !user) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return user ? <Navigate to="/dashboard" /> : <>{children}</>
}

function AdminRoute({ children, requireRole }: { children: React.ReactNode; requireRole?: 'Super Admin' | 'Content Admin' | 'Support Admin' | ('Super Admin' | 'Content Admin' | 'Support Admin')[] }) {
  const { admin, isLoading, hasRole } = useAdminAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading admin panel...</p>
        </div>
      </div>
    )
  }
  
  if (!admin) {
    return <Navigate to="/admin/login" />
  }
  
  if (requireRole && !hasRole(requireRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-200 mb-6">You don't have permission to access this resource.</p>
          <Navigate to="/admin/dashboard" />
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

function AdminAuthRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading...</p>
        </div>
      </div>
    )
  }
  
  return admin ? <Navigate to="/admin/dashboard" /> : <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/lab-report-guide" element={<LabReportGuide />} />
      <Route path="/see-scidraft-in-action" element={<SeeSciDraftInAction />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/new-report" element={<ProtectedRoute><NewReport /></ProtectedRoute>} />
      <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
      <Route path="/report/:id" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
      <Route path="/draft-viewer/:sessionId" element={<ProtectedRoute requireAuth={false}><DraftViewer /></ProtectedRoute>} />
      <Route path="/report-viewer/:id" element={<ReportViewer />} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPlans /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><FeedbackSupport /></ProtectedRoute>} />

      
      {/* Admin Auth Routes */}
      <Route path="/admin/login" element={<AdminAuthRoute><AdminLogin /></AdminAuthRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/:reportId" element={<AdminReportDetails />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="prompts" element={<AdminPrompts />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="admins" element={<AdminRoute requireRole="Super Admin"><AdminAdmins /></AdminRoute>} />
        <Route path="system" element={<AdminRoute requireRole="Super Admin"><AdminSystemSettings /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

function App() {
  // Add debugging for production
  console.log('App component rendering...')
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL)
  
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ErrorBoundary>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </ErrorBoundary>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
