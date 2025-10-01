import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type FeedbackType = 'bug' | 'feature' | 'general' | 'support'
type Priority = 'low' | 'medium' | 'high'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

export function FeedbackSupport() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'feedback' | 'support' | 'faq'>('feedback')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general')
  const [priority, setPriority] = useState<Priority>('medium')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I create my first lab report?',
      answer: 'To create your first lab report, click on "New Report" from your dashboard, select your subject and unit, choose the practical you performed, select a manual template, and then fill in your experimental data and observations.',
      category: 'Getting Started'
    },
    {
      id: '2',
      question: 'What file formats can I export my reports to?',
      answer: 'Free users can export to PDF format. Student plan users can export to PDF, Word, and LaTeX formats. Institution plan users have access to all export formats including custom formats.',
      category: 'Export & Download'
    },
    {
      id: '3',
      question: 'How many reports can I create per month?',
      answer: 'Free users can create up to 3 reports per month. Student and Institution plan users have unlimited report creation.',
      category: 'Plans & Limits'
    },
    {
      id: '4',
      question: 'Can I collaborate with my lab partners on reports?',
      answer: 'Yes, Student and Institution plan users can collaborate on reports. You can share reports with lab partners and work together in real-time.',
      category: 'Collaboration'
    },
    {
      id: '5',
      question: 'How do I upload my experimental data?',
      answer: 'You can upload experimental data in various formats including CSV, Excel, and manual entry. Use the data input section in the report editor to add your measurements and observations.',
      category: 'Data Input'
    },
    {
      id: '6',
      question: 'What subjects and practicals are supported?',
      answer: 'SciDraft supports a wide range of science subjects including Physics, Chemistry, Biology, and Engineering. We have hundreds of practical templates covering common laboratory experiments.',
      category: 'Subjects & Practicals'
    },
    {
      id: '7',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page, enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      category: 'Account & Security'
    },
    {
      id: '8',
      question: 'Can I customize the report templates?',
      answer: 'Student and Institution plan users can customize report templates, including adding custom sections, modifying formatting, and creating their own templates.',
      category: 'Customization'
    }
  ]

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setLoading(true)
    try {
      // In a real app, this would submit to a feedback/support system
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSubmitted(true)
      setSubject('')
      setMessage('')
      setRating(0)
      
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-5 w-5" />
      case 'feature':
        return <Lightbulb className="h-5 w-5" />
      case 'support':
        return <HelpCircle className="h-5 w-5" />
      default:
        return <MessageCircle className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const faqCategories = [...new Set(faqs.map(faq => faq.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-gray-600 mt-1">
                Get help, share feedback, and find answers
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'feedback'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Feedback
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'support'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Support
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
              activeTab === 'faq'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            FAQ
          </button>
        </div>

        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Share Your Feedback</h2>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Thank you for your feedback!
                    </h3>
                    <p className="text-gray-600">
                      We appreciate your input and will review it carefully.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-6">
                    {/* Feedback Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Feedback Type
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { type: 'general' as FeedbackType, label: 'General', icon: MessageCircle },
                          { type: 'bug' as FeedbackType, label: 'Bug Report', icon: Bug },
                          { type: 'feature' as FeedbackType, label: 'Feature Request', icon: Lightbulb },
                          { type: 'support' as FeedbackType, label: 'Support', icon: HelpCircle }
                        ].map(({ type, label, icon: Icon }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFeedbackType(type)}
                            className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center text-sm ${
                              feedbackType === type
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <Icon className="h-5 w-5 mb-1" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Priority
                      </label>
                      <div className="flex space-x-3">
                        {[
                          { priority: 'low' as Priority, label: 'Low' },
                          { priority: 'medium' as Priority, label: 'Medium' },
                          { priority: 'high' as Priority, label: 'High' }
                        ].map(({ priority: p, label }) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              priority === p
                                ? getPriorityColor(p)
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Overall Rating (Optional)
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-1 transition-colors ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of your feedback"
                        required
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Please provide detailed information about your feedback..."
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading || !subject.trim() || !message.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Feedback
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <ThumbsUp className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Like SciDraft?</div>
                      <div className="text-sm text-gray-600">Rate us on the app store</div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bug className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Found a bug?</div>
                      <div className="text-sm text-gray-600">Report it quickly</div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Lightbulb className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Have an idea?</div>
                      <div className="text-sm text-gray-600">Suggest a feature</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">General feedback: 2-3 days</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Bug reports: 1-2 days</span>
                  </div>
                  <div className="flex items-center">
                    <HelpCircle className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Support requests: Same day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Options */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Support</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600 mr-4" />
                    <div>
                      <div className="font-medium text-gray-900">Email Support</div>
                      <div className="text-sm text-gray-600">support@scidraft.com</div>
                      <div className="text-xs text-gray-500">Response within 24 hours</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600 mr-4" />
                    <div>
                      <div className="font-medium text-gray-900">Phone Support</div>
                      <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
                      <div className="text-xs text-gray-500">Mon-Fri, 9 AM - 6 PM EST</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-purple-600 mr-4" />
                    <div>
                      <div className="font-medium text-gray-900">Live Chat</div>
                      <div className="text-sm text-gray-600">Available 24/7</div>
                      <div className="text-xs text-gray-500">Instant response</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Resources */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Support Resources</h2>
                
                <div className="space-y-4">
                  <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="h-6 w-6 text-blue-600 mr-4" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">User Guide</div>
                      <div className="text-sm text-gray-600">Complete documentation</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                  
                  <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageCircle className="h-6 w-6 text-green-600 mr-4" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Community Forum</div>
                      <div className="text-sm text-gray-600">Ask questions & share tips</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                  
                  <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="h-6 w-6 text-purple-600 mr-4" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Video Tutorials</div>
                      <div className="text-sm text-gray-600">Step-by-step guides</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div>
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search frequently asked questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* FAQ Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {faqCategories.map((category) => (
                      <button
                        key={category}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">{faq.question}</h3>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full mt-2 inline-block">
                            {faq.category}
                          </span>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {expandedFAQ === faq.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="px-6 pb-4 border-t border-gray-200"
                        >
                          <p className="text-gray-600 pt-4">{faq.answer}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No FAQs found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or browse all categories.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}