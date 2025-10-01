import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { withAdminRole } from '../../contexts/AdminAuthContext'
import {
  Users,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  LineChart
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  payingUsers: number
  conversionRate: number
  reportsGenerated: number
  revenue: number
  failedPayments: number
  failedExports: number
}

interface ChartData {
  date: string
  signups: number
  drafts: number
  exports: number
  revenue: number
  reports?: number
}

interface Alert {
  id: string
  type: 'payment' | 'export'
  message: string
  details: string
  timestamp: string
  severity: 'high' | 'medium' | 'low'
}

function AdminDashboardComponent() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    payingUsers: 0,
    conversionRate: 0,
    reportsGenerated: 0,
    revenue: 0,
    failedPayments: 0,
    failedExports: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'1' | '7' | '30'>('7')

  useEffect(() => {
    fetchDashboardData()
  }, [timeFilter])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchMetrics(),
        fetchChartData(),
        fetchAlerts()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      // Fetch active users (users with recent activity - signed in within last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', twentyFourHoursAgo)
      
      if (activeUsersError) {
        console.error('Error fetching active users:', activeUsersError)
        // Don't throw error for active users, just set to 0
      }
      
      // Fetch total payment amount from payments table
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
        // Don't throw error for payments, just set to 0
      }
      
      const totalPaymentAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      
      // Fetch paying users (users who have made successful payments)
      const { data: payingUsersData, error: payingUsersError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('status', 'success')
      
      if (payingUsersError) {
        console.error('Error fetching paying users:', payingUsersError)
        // Don't throw error, just set to 0
      }
      
      const uniquePayingUsers = new Set(payingUsersData?.map(p => p.user_id) || [])
      const payingUsers = uniquePayingUsers.size
      
      // Calculate conversion rate
      const conversionRate = totalUsers && totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0
      
      // Fetch reports generated in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: reportsGenerated, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo)
      
      if (reportsError) {
        console.error('Error fetching reports:', reportsError)
        // Don't throw error, just set to 0
      }
      
      setMetrics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        payingUsers: payingUsers || 0,
        conversionRate,
        reportsGenerated: reportsGenerated || 0,
        revenue: totalPaymentAmount,
        failedPayments: 0, // Will be calculated in fetchAlerts
        failedExports: 0   // Will be calculated in fetchAlerts
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load metrics')
      // Set fallback metrics
      setMetrics({
        totalUsers: 0,
        activeUsers: 0,
        payingUsers: 0,
        conversionRate: 0,
        reportsGenerated: 0,
        revenue: 0,
        failedPayments: 0,
        failedExports: 0
      })
    }
  }

  // Fetch analytics data for charts (drafts vs reports)
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days

      // Fetch drafts data
      const { data: draftsData, error: draftsError } = await supabase
        .from('drafts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (draftsError) {
        console.error('Error fetching drafts data:', draftsError);
        throw new Error(`Failed to fetch drafts: ${draftsError.message}`);
      }

      // Fetch reports data
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (reportsError) {
        console.error('Error fetching reports data:', reportsError);
        throw new Error(`Failed to fetch reports: ${reportsError.message}`);
      }

      // Group data by date
      const dateMap = new Map();
      
      // Initialize all dates with zero counts
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, { date: dateKey, drafts: 0, reports: 0 });
      }

      // Count drafts by date
      draftsData?.forEach(draft => {
        const dateKey = draft.created_at.split('T')[0];
        if (dateMap.has(dateKey)) {
          dateMap.get(dateKey).drafts++;
        }
      });

      // Count reports by date
      reportsData?.forEach(report => {
        const dateKey = report.created_at.split('T')[0];
        if (dateMap.has(dateKey)) {
          dateMap.get(dateKey).reports++;
        }
      });

      const chartData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep the original fetchChartData for compatibility
  const fetchChartData = async () => {
    try {
      const daysAgo = parseInt(timeFilter)
      const dates = Array.from({ length: daysAgo }, (_, i) => {
        const date = new Date(Date.now() - (daysAgo - 1 - i) * 24 * 60 * 60 * 1000)
        return date.toISOString().split('T')[0]
      })

      const chartDataPromises = dates.map(async (date) => {
        const nextDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Signups
        const { data: signups, error: signupsError } = await supabase
          .from('users')
          .select('id')
          .gte('created_at', date)
          .lt('created_at', nextDate)
          .neq('role', 'admin')

        if (signupsError) throw signupsError

        // Drafts - use drafts table instead of reports.status
        const { data: draftsData, error: draftsError } = await supabase
          .from('drafts')
          .select('id')
          .gte('created_at', date)
          .lt('created_at', nextDate)

        if (draftsError) throw draftsError

        // Reports - count all reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('id')
          .gte('created_at', date)
          .lt('created_at', nextDate)

        if (reportsError) throw reportsError

        const drafts = draftsData?.length || 0
        const exports = reportsData?.length || 0

        // Revenue
        const { data: dailyPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'success')
          .gte('created_at', date)
          .lt('created_at', nextDate)

        if (paymentsError) throw paymentsError

        const revenue = dailyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

        return {
          date,
          signups: signups?.length || 0,
          drafts,
          exports,
          revenue
        }
      })

      const data = await Promise.all(chartDataPromises)
      setChartData(data)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load chart data')
      // Set fallback data
      setChartData([])
    }
  }

  // Fetch alerts (failed payments and exports)
  const fetchAlerts = async () => {
    try {
      // Failed payments
      const { data: failedPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (paymentsError) throw paymentsError

      // Since exports table doesn't exist, we'll skip failed exports for now
      // and just show failed payments as alerts
      const alerts = [
        ...(failedPayments || []).map(payment => ({
          id: payment.id,
          type: 'payment' as const,
          message: `Payment failed for user ${payment.user_id}`,
          details: `Payment ID: ${payment.id}, Amount: ${payment.amount}`,
          timestamp: payment.created_at,
          severity: 'high' as const
        }))
      ]

      setAlerts(alerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load alerts')
      // Set fallback data
      setAlerts([])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-blue-300">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-blue-300">Overview of your SciDraft admin panel</p>
        </div>
        
        {/* Time Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-blue-300">Filter:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as '1' | '7' | '30')}
            className="px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Total Users</p>
              <p className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Paying Users */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Paying Users</p>
              <p className="text-2xl font-bold text-white">{metrics.payingUsers.toLocaleString()}</p>
              <p className="text-xs text-green-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {metrics.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Reports Generated */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Reports Generated</p>
              <p className="text-2xl font-bold text-white">{metrics.reportsGenerated.toLocaleString()}</p>
              <p className="text-xs text-blue-400">Last {timeFilter} days</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Revenue (MTD)</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(metrics.revenue)}</p>
              <p className="text-xs text-blue-400">Month to date</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Analytics Chart */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Daily Analytics</h3>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" opacity={0.7} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#93c5fd"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    stroke="#93c5fd" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                    tickFormatter={(value) => value.toString()}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)',
                      color: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                      padding: '12px 16px',
                      fontSize: '14px'
                    }}
                    labelStyle={{ 
                      color: '#ffffff',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      });
                    }}
                    formatter={(value, name) => [
                      `${value} ${String(name).toLowerCase()}`,
                      String(name)
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px'
                    }}
                    iconType="rect"
                  />
                  <Bar 
                    dataKey="drafts" 
                    name="Draft Reports" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar 
                    dataKey="reports" 
                    name="Completed Reports" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-blue-300">
                <div className="text-center">
                  <div className="text-blue-400 mb-2">
                    <BarChart3 className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-sm">No analytics data available</p>
                  <p className="text-xs text-blue-400 mt-1">Data will appear once reports are created</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="h-64 flex items-end space-x-2">
            {chartData.length > 0 ? chartData.map((data, index) => {
              const maxRevenue = Math.max(...chartData.map(d => d.revenue))
              const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 200 : 0
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${height}px` }}
                    title={`${formatCurrency(data.revenue)} revenue on ${formatDate(data.date)}`}
                  />
                  <span className="text-xs text-blue-400 mt-2">{formatDate(data.date)}</span>
                </div>
              )
            }) : (
              <div className="flex items-center justify-center w-full h-full text-blue-300">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Alerts (Last 24h)</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-300">
              {metrics.failedPayments + metrics.failedExports} total issues
            </span>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-blue-300">No alerts in the last 24 hours</p>
            <p className="text-sm text-blue-400">All systems running smoothly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-white/10 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.severity === 'high' ? 'bg-red-400' :
                  alert.severity === 'medium' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {alert.type === 'payment' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="font-medium text-white">{alert.message}</span>
                  </div>
                  <p className="text-sm text-blue-300 mt-1">{alert.details}</p>
                  <p className="text-xs text-blue-400 mt-1">{getTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
            ))}
            
            {alerts.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                  View all {alerts.length} alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Export with Admin role protection
export const AdminDashboard = withAdminRole(AdminDashboardComponent, { requiredRole: 'Content Admin' })