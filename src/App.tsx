import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
// Removed Landing, Auth, and Dashboard pages
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

// Auth route guards removed

// Admin route guards removed

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/new-report" replace />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/lab-report-guide" element={<LabReportGuide />} />
      <Route path="/see-scidraft-in-action" element={<SeeSciDraftInAction />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Auth Routes removed */}
      
      {/* Protected Routes removed; pages now publicly accessible */}
      {/* Dashboard route removed */}
      <Route path="/new-report" element={<NewReport />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="/report/:id" element={<ReportEditor />} />
      <Route path="/draft-viewer/:sessionId" element={<DraftViewer />} />
      <Route path="/report-viewer/:id" element={<ReportViewer />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/payments" element={<PaymentsPlans />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/support" element={<FeedbackSupport />} />

      
      {/* Admin Auth Routes removed */}
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/:reportId" element={<AdminReportDetails />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="prompts" element={<AdminPrompts />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="system" element={<AdminSystemSettings />} />
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
