import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
// Removed Landing, Auth, and Dashboard pages
import { NewReport } from './pages/NewReport'
import { LandingPage } from './pages/LandingPage'
import { ReportEditor } from './pages/ReportEditor'
import { DraftViewer } from './pages/DraftViewer'
import { PaymentPage } from './pages/Payment'
import { ReportViewer } from './pages/ReportViewer'
import Templates from './pages/Templates'
import { TermsOfService } from './pages/TermsOfService'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
// Admin Components
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminReports } from './pages/admin/AdminReports'
import AdminPayments from './pages/admin/AdminPayments'

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
      <Route path="/" element={<LandingPage />} />
      
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      
      
      {/* Auth Routes removed */}
      
      {/* Protected Routes removed; pages now publicly accessible */}
      {/* Dashboard route removed */}
      <Route path="/new-report" element={<NewReport />} />
      <Route path="/report/:id" element={<ReportEditor />} />
      <Route path="/draft-viewer/:sessionId" element={<DraftViewer />} />
      <Route path="/payment/:sessionId" element={<PaymentPage />} />
      <Route path="/report-viewer/:id" element={<Navigate to="/" replace />} />
      <Route path="/templates" element={<Templates />} />

      

      
      {/* Admin Auth Routes removed */}
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/:reportId" element={<AdminReportDetails />} />
        <Route path="payments" element={<AdminPayments />} />
        
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
