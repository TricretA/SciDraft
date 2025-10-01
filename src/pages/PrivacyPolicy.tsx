import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Cookie, 
  Users, 
  Mail, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  FileText,
  Clock,
  Download,
  Trash2,
  UserCheck,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export function PrivacyPolicy() {
  const lastUpdated = "December 20, 2024"
  const { scrollYProgress } = useScroll()
  const [activeSection, setActiveSection] = useState('')
  
  // Animated gradient background
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6])
  
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
      id: "overview",
      title: "Privacy Overview",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>
            At SciDraft, we are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when you use our AI-powered scientific writing platform.
          </p>
          <p>
            We practice data minimization and give you full control over your personal information.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">Our Commitment</h4>
                <p className="text-sm text-green-700 mt-1">
                  We never sell your personal data to third parties and only use your information to provide and improve our educational services.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "collect",
      title: "Information We Collect",
      icon: Database,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
            <p className="mb-3">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Basic Details:</strong> Name, email address, and account preferences</li>
              <li><strong>Authentication:</strong> Secure password and profile settings</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Platform Activity:</strong> How you use our services to improve functionality</li>
              <li><strong>Support Data:</strong> Information needed to provide customer support</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Security Information:</strong> IP address and browser type for security</li>
              <li><strong>Functionality Data:</strong> Basic technical information for platform operation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p>We use your information to provide and improve our services:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Service Delivery
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Providing our AI-powered writing platform</li>
                <li>• Managing your account</li>
                <li>• Save and sync your work across devices</li>
                <li>• Provide customer support</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Platform Improvement
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Analyzing usage to enhance user experience</li>
                <li>• Develop new features</li>
                <li>• Improve platform performance</li>
                <li>• Conduct research and analytics</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Communication & Support
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Sending important updates</li>
                <li>• Providing customer support</li>
                <li>• Share educational resources</li>
                <li>• Send promotional content (with consent)</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Protecting our platform and users from fraud and abuse</li>
                <li>• Ensure platform security</li>
                <li>• Comply with legal obligations</li>
                <li>• Enforce terms of service</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "information-sharing",
      title: "Information Sharing and Disclosure",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>
            We only share your information with trusted partners who help us provide our services.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Service Providers</h4>
              <p className="text-gray-700 text-sm">
                Third-party services that help operate our platform (hosting, payments, analytics).
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Legal Requirements</h4>
              <p className="text-gray-700 text-sm">
                When required by law or to protect our platform and users.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">What We Never Do</h4>
                <p className="text-sm text-red-700 mt-1">
                  We never sell your personal data to advertisers, marketing companies, or data brokers. 
                  Your educational content and reports remain private and are never shared without your explicit consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p>
            We use industry-standard security measures to protect your information.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Security Measures</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Encryption and secure data transmission</li>
                <li>• Access controls protect your data</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Your Responsibility</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Keep your account credentials secure</li>
                <li>• Report any suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "cookies",
      title: "Cookies and Tracking Technologies",
      icon: Cookie,
      content: (
        <div className="space-y-4">
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our platform. 
            Here's what you need to know:
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
              <p className="text-gray-700 text-sm mb-2">
                These cookies are necessary for the platform to function properly:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Authentication and session management</li>
                <li>• Security and fraud prevention</li>
                <li>• Load balancing and performance optimization</li>
                <li>• User preference storage</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
              <p className="text-gray-700 text-sm mb-2">
                These help us understand how users interact with our platform:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Page views and user navigation patterns</li>
                <li>• Feature usage and performance metrics</li>
                <li>• Error tracking and debugging information</li>
                <li>• A/B testing and optimization data</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Marketing Cookies (Optional)</h4>
              <p className="text-gray-700 text-sm mb-2">
                With your consent, we may use cookies for:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Personalized content recommendations</li>
                <li>• Targeted educational resources</li>
                <li>• Social media integration</li>
                <li>• Advertising campaign effectiveness</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Settings className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">Cookie Management</h4>
                <p className="text-sm text-blue-700 mt-1">
                  You can control cookie settings through your browser preferences or our cookie consent banner. 
                  Note that disabling essential cookies may affect platform functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "your-rights",
      title: "Your Privacy Rights",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p>
            You have rights regarding your personal information. Contact us to exercise these rights.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Access Your Data
              </h4>
              <p className="text-sm text-green-800">
                Request a copy of your personal information.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Update Information
              </h4>
              <p className="text-sm text-blue-800">
                Correct or update your personal data through your account settings.
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </h4>
              <p className="text-sm text-red-800">
                Request deletion of your account and associated data.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            We retain your personal information only as long as necessary to provide our services and comply with legal obligations.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Active Accounts</h4>
              <p className="text-gray-700 text-sm">
                While your account is active, we retain your personal information, reports, and usage data to provide continuous service.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Inactive Accounts</h4>
              <p className="text-gray-700 text-sm">
                If you don't use your account for 24 months, we may delete your personal information after providing 30 days' notice. 
                Your reports may be retained in anonymized form for research purposes.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Deleted Accounts</h4>
              <p className="text-gray-700 text-sm">
                When you delete your account, we remove your personal information within 30 days. 
                Some data may be retained longer if required by law or for legitimate business purposes.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Legal Requirements</h4>
              <p className="text-gray-700 text-sm">
                We may retain certain information longer if required by law, regulation, or legal process, 
                or to protect our rights and interests.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p>
            SciDraft operates globally, and your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place for international transfers.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Data Processing Locations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Primary servers: United States (Supabase/AWS)</li>
                <li>• CDN and caching: Global (Vercel/Cloudflare)</li>
                <li>• Payment processing: United States (Stripe)</li>
                <li>• Analytics: United States (various providers)</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Transfer Safeguards</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Standard Contractual Clauses (SCCs) with service providers</li>
                <li>• Adequacy decisions for transfers to approved countries</li>
                <li>• Binding Corporate Rules for intra-group transfers</li>
                <li>• Regular compliance monitoring and audits</li>
              </ul>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm">
            If you are located in the European Economic Area (EEA), United Kingdom, or other regions with specific data protection laws, 
            we ensure that any international transfers comply with applicable regulations and provide adequate protection for your personal data.
          </p>
        </div>
      )
    },
    {
      id: "children-privacy",
      title: "Children's Privacy",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>
            SciDraft is designed for educational use and may be used by students of various ages. 
            We are committed to protecting the privacy of all users, including minors.
          </p>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Users Under 13</h4>
              <p className="text-sm text-yellow-800">
                We do not knowingly collect personal information from children under 13 without verifiable parental consent. 
                If we discover we have collected such information, we will delete it promptly.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Educational Use</h4>
              <p className="text-sm text-blue-800">
                When SciDraft is used in educational settings, schools and parents should review this privacy policy 
                and ensure appropriate permissions are in place for student use.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Parental Rights</h4>
              <p className="text-sm text-green-800">
                Parents have the right to review, modify, or delete their child's personal information. 
                Contact us at tricre8team@gmail.com for assistance with parental requests.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
            legal requirements, or other factors.
          </p>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Notification of Changes</h4>
              <p className="text-gray-700 text-sm mb-2">
                When we make significant changes to this policy, we will:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Update the "Last Updated" date at the top of this policy</li>
                <li>• Send email notifications to registered users</li>
                <li>• Display prominent notices on our platform</li>
                <li>• Provide a summary of key changes</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Your Continued Use</h4>
              <p className="text-gray-700 text-sm">
                By continuing to use SciDraft after changes become effective, you agree to the updated Privacy Policy. 
                If you disagree with the changes, you may delete your account.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "contact",
      title: "Contact Us",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
            please don't hesitate to contact us:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>tricre8team@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Response within 2 hours</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Mailing Address</h4>
              <div className="text-sm text-green-800">
                SciDraft<br />
                40200 Kisii<br />
                Kenya
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)',
          backgroundSize: '400% 400%',
          y: backgroundY,
          opacity
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Glassmorphism Overlay */}
      <div className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm" />
      
      {/* Content Container */}
      <div className="relative z-20">
        {/* Header */}
        <motion.header 
          className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255,255,255,0.3)',
                    '0 0 40px rgba(255,255,255,0.5)',
                    '0 0 20px rgba(255,255,255,0.3)'
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-4xl font-bold text-white drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Privacy Policy
                </motion.h1>
                <motion.p 
                  className="text-sm text-white/80 mt-2 drop-shadow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >

                </motion.p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl group"
              >
                <ChevronRight className="h-5 w-5 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Home
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 sticky top-24 border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 drop-shadow-lg">Table of Contents</h2>
              <nav className="space-y-3">
                {sections.map((section, index) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <motion.a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`flex items-center p-4 rounded-xl transition-all duration-300 group border ${
                        isActive 
                          ? 'bg-white/30 text-white border-white/40 shadow-lg' 
                          : 'text-white/80 hover:text-white hover:bg-white/20 border-white/10 hover:border-white/30'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className={`p-2 rounded-lg mr-3 ${
                          isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                        }`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span className="text-sm font-medium">{section.title}</span>
                      {isActive && (
                        <motion.div
                          className="ml-auto w-2 h-2 bg-white rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.a>
                  )
                })}
              </nav>
            </motion.div>
          </motion.div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4">
                  <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Privacy Matters to Us
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  At SciDraft, we believe privacy is a fundamental right. This policy explains how we collect, use, 
                  and protect your personal information while providing the best educational experience possible.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Our Privacy Principles</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• We never sell your personal data to third parties</li>
                      <li>• We collect only what's necessary to provide our services</li>
                      <li>• We use industry-standard security measures to protect your data</li>
                      <li>• We give you control over your personal information</li>
                      <li>• We are transparent about our data practices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sections */}
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={section.id}
                  id={section.id}
                  data-section={section.id}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.25)"
                  }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 hover:border-white/30 transition-all duration-500 group p-8"
                >
                  <div className="flex items-center mb-6">
                    <motion.div 
                      className="inline-flex items-center justify-center w-12 h-12 bg-white/20 text-white rounded-xl mr-4 group-hover:bg-white/30 transition-all duration-300"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-6 w-6 drop-shadow-lg" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg group-hover:text-white/90 transition-colors duration-300">{section.title}</h2>
                  </div>
                  <div className="text-white/90 leading-relaxed drop-shadow group-hover:text-white transition-colors duration-300">
                    {section.content}
                  </div>
                </motion.div>
              )
            })}

            {/* Footer CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all duration-500"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
              <motion.h2 
                className="text-2xl font-bold mb-4 text-white drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Questions About Your Privacy?
              </motion.h2>
              <motion.p 
                className="text-white/80 mb-6 max-w-2xl mx-auto drop-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                We're here to help. If you have any questions about this Privacy Policy or how we handle your data, 
                don't hesitate to reach out to our privacy team.
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.a
                  href="mailto:tricre8team@gmail.com"
                  className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 group shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Contact Privacy Team
                </motion.a>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/terms"
                    className="inline-flex items-center px-8 py-4 border-2 border-white/50 text-white rounded-xl font-semibold hover:bg-white/20 hover:border-white/70 transition-all duration-300 group shadow-lg hover:shadow-xl backdrop-blur-sm"
                  >
                    <span className="group-hover:scale-105 transition-transform duration-300">Terms of Service</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}