import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, 
  X, 
  Star, 
  CreditCard, 
  Calendar, 
  Download, 
  FileText, 
  Users, 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight,
  Crown,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  limitations: string[]
  popular?: boolean
  current?: boolean
}

interface PaymentHistory {
  id: string
  amount: number
  status: string
  created_at: string
  plan_name: string
}

export function PaymentsPlans() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans')
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        '3 reports per month',
        'Basic templates',
        'Standard export (PDF)',
        'Email support',
        'Basic formatting'
      ],
      limitations: [
        'Limited to 3 reports monthly',
        'No advanced templates',
        'No priority support'
      ]
    },
    {
      id: 'student',
      name: 'Student',
      price: billingInterval === 'month' ? 9.99 : 99.99,
      interval: billingInterval,
      popular: true,
      features: [
        'Unlimited reports',
        'All premium templates',
        'Advanced formatting',
        'Multiple export formats',
        'Priority email support',
        'Collaboration tools',
        'Data visualization',
        'Custom branding'
      ],
      limitations: [
        'Single user account',
        'Standard processing speed'
      ]
    },
    {
      id: 'institution',
      name: 'Institution',
      price: billingInterval === 'month' ? 49.99 : 499.99,
      interval: billingInterval,
      features: [
        'Everything in Student',
        'Multi-user management',
        'Bulk report generation',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated support',
        'Training sessions',
        'API access',
        'White-label options'
      ],
      limitations: [
        'Minimum 5 users required'
      ]
    }
  ]

  useEffect(() => {
    if (user) {
      fetchPaymentHistory()
      fetchCurrentPlan()
    }
  }, [user])

  const fetchPaymentHistory = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaymentHistory(data || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
    }
  }

  const fetchCurrentPlan = async () => {
    if (!user) return

    try {
      // This would typically come from a user subscription table
      // For now, we'll assume free plan
      setCurrentPlan('free')
    } catch (error) {
      console.error('Error fetching current plan:', error)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    try {
      // This would integrate with Stripe or another payment processor
      console.log('Upgrading to plan:', planId)
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user's plan
      setCurrentPlan(planId)
    } catch (error) {
      console.error('Error upgrading plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Free'
    return `$${price.toFixed(2)}/${interval}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments & Plans</h1>
              <p className="text-gray-600 mt-1">
                Manage your subscription and billing
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plans'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Plans & Pricing
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment History
          </button>
        </div>

        {activeTab === 'plans' ? (
          <div>
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setBillingInterval('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      billingInterval === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval('year')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                      billingInterval === 'year'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden ${
                    plan.popular
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  } ${
                    currentPlan === plan.id
                      ? 'ring-2 ring-green-200 border-green-500'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {currentPlan === plan.id && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Crown className="h-3 w-3 mr-1" />
                        Current Plan
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {formatPrice(plan.price, plan.interval)}
                      </div>
                      {plan.price > 0 && (
                        <p className="text-gray-600 text-sm">
                          Billed {plan.interval}ly
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Features
                        </h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.limitations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <X className="h-4 w-4 text-red-500 mr-2" />
                            Limitations
                          </h4>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-600">
                                <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <motion.button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loading || currentPlan === plan.id}
                      whileHover={{ scale: currentPlan === plan.id ? 1 : 1.02 }}
                      whileTap={{ scale: currentPlan === plan.id ? 1 : 0.98 }}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                        currentPlan === plan.id
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : currentPlan === plan.id ? (
                        'Current Plan'
                      ) : plan.price === 0 ? (
                        'Get Started'
                      ) : (
                        <>
                          Upgrade Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features Comparison */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Feature Comparison</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Feature</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Free</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Student</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Institution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Monthly Reports</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">3</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">Unlimited</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">Unlimited</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">Premium Templates</td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Export Formats</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">PDF</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">PDF, Word, LaTeX</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">All Formats</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">Priority Support</td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Multi-user Management</td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">API Access</td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Payment History */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            </div>
            
            {paymentHistory.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h3>
                <p className="text-gray-600">Your payment history will appear here once you make your first purchase.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{payment.plan_name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          getStatusColor(payment.status)
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </div>
                      </div>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h4>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for institutional plans.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600 text-sm">
                Yes, all new users start with our free plan. You can upgrade anytime to access premium features.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h4>
              <p className="text-gray-600 text-sm">
                We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}