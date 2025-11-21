import { useEffect } from 'react'

/**
 * Custom hook to dynamically set page titles for SEO optimization
 * @param title - The page title to set
 * @param suffix - Optional suffix to append (defaults to 'SciDraft')
 */
export function usePageTitle(title: string, suffix: string = 'SciDraft') {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : suffix
    document.title = fullTitle
    
    // Update meta description if provided
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && title) {
      // You can customize descriptions per page here if needed
      const descriptions: Record<string, string> = {
        'Dashboard': 'Access your SciDraft dashboard to manage lab reports, view drafts, and track your academic writing progress.',
        'New Report': 'Create a new lab report with SciDraft. Upload your manual, enter results, and generate professional academic reports.',
        'My Reports': 'View and manage all your lab reports in one place. Download, edit, and organize your academic documents.',
        'About': 'Learn about SciDraft - the AI-powered lab report generator that helps students create professional academic reports.',
        'Contact': 'Get in touch with the SciDraft team. We\'re here to help with your academic writing needs.',
      
        'Privacy Policy': 'Read SciDraft\'s privacy policy to understand how we protect and handle your personal information.',
        'Terms of Service': 'Review SciDraft\'s terms of service and user agreement for our academic writing platform.',
        // Auth pages removed
        'Payments': 'View SciDraft pricing plans and manage your subscription for unlimited lab report generation.',
        'Settings': 'Manage your SciDraft account settings, preferences, and profile information.',
        'Feedback': 'Provide feedback about your SciDraft experience and help us improve our platform.'
      }
      
      const pageDescription = descriptions[title]
      if (pageDescription) {
        metaDescription.setAttribute('content', pageDescription)
      }
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = suffix
    }
  }, [title, suffix])
}

/**
 * Page title constants for consistency across the application
 */
export const PAGE_TITLES = {
  HOME: 'AI-Powered Lab Report Generator',
  DASHBOARD: 'Dashboard',
  NEW_REPORT: 'New Report',
  MY_REPORTS: 'My Reports',
  REPORT_EDITOR: 'Report Editor',
  DRAFT_VIEWER: 'Draft Viewer',
  REPORT_VIEWER: 'Report Viewer',
  ABOUT: 'About',
  CONTACT: 'Contact',

  PRIVACY: 'Privacy Policy',
  TERMS: 'Terms of Service',
  LOGIN: 'Login',
  SIGNUP: 'Sign Up',
  RESET_PASSWORD: 'Reset Password',
  PAYMENTS: 'Payments',
  SETTINGS: 'Settings',
  FEEDBACK: 'Feedback',
  SUPPORT: 'Support',
  // Admin pages
  ADMIN_DASHBOARD: 'Admin Dashboard',
  ADMIN_USERS: 'User Management',
  ADMIN_REPORTS: 'Report Management',
  ADMIN_PAYMENTS: 'Payment Management',
  ADMIN_FEEDBACK: 'Feedback Management',
  ADMIN_PROMPTS: 'Prompt Management',
  ADMIN_NOTIFICATIONS: 'Notifications',
  ADMIN_ADMINS: 'Admin Management',
  ADMIN_SYSTEM: 'System Settings',
  ADMIN_LOGIN: 'Admin Login'
} as const
