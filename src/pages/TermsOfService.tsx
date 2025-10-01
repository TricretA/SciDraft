import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { 
  FileText, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Scale,
  Users,
  Lock,
  CreditCard,
  RefreshCw,
  XCircle,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export function TermsOfService() {
  const lastUpdated = "December 15, 2024"
  const { scrollYProgress } = useScroll()
  const [activeSection, setActiveSection] = useState('')
  
  // Animated gradient background based on scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const gradientRotation = useTransform(scrollYProgress, [0, 1], [0, 360])
  
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]')
      const scrollPosition = window.scrollY + 200
      
      sections.forEach((section) => {
        const element = section as HTMLElement
        const top = element.offsetTop
        const height = element.offsetHeight
        
        if (scrollPosition >= top && scrollPosition < top + height) {
          setActiveSection(element.dataset.section || '')
        }
      })
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const sections: Section[] = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p>
            By accessing and using SciDraft ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
          <p>
            These Terms of Service ("Terms") govern your use of our website located at scidraft.com (the "Service") operated by SciDraft Inc. ("us", "we", or "our").
          </p>
          <p>
            Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. 
            These Terms apply to all visitors, users and others who access or use the Service.
          </p>
        </div>
      )
    },
    {
      id: "description",
      title: "Service Description",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            SciDraft is an educational technology platform that helps students create professional lab reports by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Providing structured templates for various scientific disciplines</li>
            <li>Offering automated formatting and citation tools</li>
            <li>Generating professional reports based on user input</li>
            <li>Facilitating collaboration between students and educators</li>
          </ul>
          <p>
            The Service is designed to enhance learning outcomes while maintaining academic integrity standards.
          </p>
        </div>
      )
    },
    {
      id: "accounts",
      title: "User Accounts",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            You are responsible for safeguarding the password and for all activities that occur under your account.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
          <p>
            We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Account Security</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You are responsible for maintaining the confidentiality of your account credentials and for restricting access to your computer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "academic-integrity",
      title: "Academic Integrity",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>
            SciDraft is designed to assist students in creating well-formatted, professional lab reports while maintaining the highest standards of academic integrity.
          </p>
          <p>
            <strong>You agree to:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service only to format and organize your own original work and data</li>
            <li>Properly cite all sources and references in your reports</li>
            <li>Comply with your institution's academic integrity policies</li>
            <li>Not share or distribute reports created by other users</li>
            <li>Not use the Service to plagiarize or misrepresent work</li>
          </ul>
          <p>
            <strong>You agree NOT to:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submit fabricated or falsified data</li>
            <li>Copy content from other users' reports</li>
            <li>Use the Service to circumvent academic requirements</li>
            <li>Share your account with other students</li>
          </ul>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Violation Consequences</h4>
                <p className="text-sm text-red-700 mt-1">
                  Violations of academic integrity policies may result in immediate account termination and notification to your educational institution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>
            You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
            <li>To upload, post, or transmit any content that is harmful, offensive, or inappropriate</li>
            <li>To attempt to gain unauthorized access to any portion of the Service</li>
          </ul>
          <p>
            We reserve the right to investigate and prosecute violations of any of the above to the fullest extent of the law.
          </p>
        </div>
      )
    },
    {
      id: "content-ownership",
      title: "Content and Intellectual Property",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p>
            <strong>Your Content:</strong> You retain ownership of all content you create using our Service, including your lab reports, data, and personal information.
          </p>
          <p>
            <strong>Our Content:</strong> The Service and its original content, features, and functionality are and will remain the exclusive property of SciDraft Inc. and its licensors.
          </p>
          <p>
            <strong>License to Use:</strong> By using our Service, you grant us a limited, non-exclusive, royalty-free license to use your content solely for the purpose of providing and improving our Service.
          </p>
          <p>
            <strong>Templates and Formats:</strong> All report templates, formatting tools, and educational resources provided by SciDraft are proprietary and protected by intellectual property laws.
          </p>
        </div>
      )
    },
    {
      id: "payments",
      title: "Payments and Subscriptions",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p>
            <strong>Subscription Plans:</strong> We offer various subscription plans with different features and usage limits. All fees are non-refundable except as required by law.
          </p>
          <p>
            <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis. You authorize us to charge your payment method for all fees.
          </p>
          <p>
            <strong>Price Changes:</strong> We may change our subscription fees at any time. We will provide at least 30 days' notice of any price changes.
          </p>
          <p>
            <strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.
          </p>
          <p>
            <strong>Refunds:</strong> We do not provide refunds for partial months of service, upgrade/downgrade refunds, or refunds for months unused with an open account.
          </p>
        </div>
      )
    },
    {
      id: "privacy",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service.
          </p>
          <p>
            By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
          </p>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">Data Security</h4>
                <p className="text-sm text-blue-700 mt-1">
                  We use industry-standard encryption and security measures to protect your data and reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "termination",
      title: "Termination",
      icon: XCircle,
      content: (
        <div className="space-y-4">
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>
          <p>
            If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
          </p>
          <p>
            Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
          </p>
          <p>
            All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
          </p>
        </div>
      )
    },
    {
      id: "disclaimers",
      title: "Disclaimers and Limitations",
      icon: AlertCircle,
      content: (
        <div className="space-y-4">
          <p>
            <strong>Service Availability:</strong> We strive to maintain high service availability but cannot guarantee uninterrupted access. The Service is provided "as is" without warranties of any kind.
          </p>
          <p>
            <strong>Educational Use:</strong> SciDraft is designed for educational purposes. We do not guarantee that use of our Service will result in improved grades or academic outcomes.
          </p>
          <p>
            <strong>Limitation of Liability:</strong> In no event shall SciDraft Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
          </p>
          <p>
            <strong>User Responsibility:</strong> You are solely responsible for ensuring that your use of the Service complies with your institution's policies and academic requirements.
          </p>
        </div>
      )
    },
    {
      id: "changes",
      title: "Changes to Terms",
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          <p>
            What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
          <p>
            If you do not agree to the new terms, please stop using the Service.
          </p>
        </div>
      )
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p>
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-gray-900">tricre8team@gmail.com</span>
              </div>
              <div className="text-gray-600">
                40200 Kisii, Kenya
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div 
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          background: `conic-gradient(from ${gradientRotation}deg, #1e293b, #1e3a8a, #581c87, #374151, #0f172a, #1e293b)`,
          y: backgroundY
        }}
      />
      
      {/* Glassmorphism Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-md -z-5" />
      
      {/* Header */}
      <motion.header 
        className="relative bg-white/10 backdrop-blur-md shadow-2xl border-b border-white/20"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Scale className="h-8 w-8 text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl font-bold text-gray-800 drop-shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Terms of Service
                </motion.h1>
                <motion.p 
                  className="text-gray-700 mt-1 drop-shadow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Last updated: {lastUpdated}
                </motion.p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/" 
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-gray-600 hover:text-gray-800 rounded-xl border border-white/30 shadow-lg transition-all duration-300 hover:shadow-xl group"
              >
                <ChevronRight className="h-4 w-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Home
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4 drop-shadow">Table of Contents</h2>
              <nav className="space-y-2">
                {sections.map((section, index) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <motion.a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                        isActive 
                          ? 'bg-white/20 border border-white/30 shadow-lg' 
                          : 'hover:bg-white/10 hover:border hover:border-white/20'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <motion.div
                        className={`transition-all duration-300 ${
                          isActive ? 'text-white scale-110' : 'text-white/70 group-hover:text-white group-hover:scale-105'
                        }`}
                        whileHover={{ rotate: 5 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span className={`text-sm transition-all duration-300 ${
                        isActive ? 'text-white font-medium' : 'text-white/80 group-hover:text-white'
                      }`}>
                        {section.title}
                      </span>
                      {isActive && (
                        <motion.div
                          className="absolute right-2 w-2 h-2 bg-white rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.a>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="space-y-8">
              {sections.map((section, index) => {
                const Icon = section.icon
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    data-section={section.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <motion.div 
                      className="flex items-center mb-6"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                    >
                      <motion.div 
                        className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-xl mr-4 border border-white/30 shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="h-6 w-6 drop-shadow" />
                      </motion.div>
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg group-hover:text-white/90 transition-colors duration-300">
                        {section.title}
                      </h2>
                    </motion.div>
                    <motion.div 
                      className="text-white/90 leading-relaxed drop-shadow prose prose-invert max-w-none"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      {section.content}
                    </motion.div>
                  </motion.section>
                )
              })}
            </div>

            {/* Footer CTA */}

          </motion.div>
        </div>
      </main>
    </div>
  )
}