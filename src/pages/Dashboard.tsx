import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Settings,
  HelpCircle,
  LogOut,
  BookOpen,
  TrendingUp,
  Filter,
  Microscope,
  TestTube,
  Beaker,
  Atom,
  Zap,
  Calendar,
  Search,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Report } from '../lib/supabase'
import { FeedbackButton } from '../components/FeedbackButton'

interface DashboardStats {
  totalReports: number
  completedReports: number
  draftReports: number
  thisMonthReports: number
  generatedDrafts: number
  fullReports: number
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    completedReports: 0,
    draftReports: 0,
    thisMonthReports: 0,
    generatedDrafts: 0,
    fullReports: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [userName, setUserName] = useState<string>('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReports()
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        // Fallback to user metadata or email
        setUserName(user.email?.split('@')[0] || 'User')
      } else {
        setUserName(data?.full_name || user.email?.split('@')[0] || 'User')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserName(user.email?.split('@')[0] || 'User')
    }
  }

  const fetchReports = async () => {
    if (!user?.id) return
    
    try {
      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      // Fetch drafts (only user-specific drafts)
      const { data: draftsData, error: draftsError } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (draftsError) throw draftsError

      setReports(reportsData || [])
      setDrafts(draftsData || [])
      calculateStats(reportsData || [], draftsData || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reportsData: Report[], draftsData: any[]) => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = {
      totalReports: reportsData.length,
      completedReports: reportsData.filter(r => r.status === 'completed').length,
      draftReports: reportsData.filter(r => r.status === 'draft').length,
      thisMonthReports: reportsData.filter(r => 
        new Date(r.created_at) >= thisMonth
      ).length,
      generatedDrafts: draftsData.length,
      fullReports: draftsData.filter(d => d.full_report && d.full_report.trim() !== '').length
    }

    setStats(stats)
  }

  // Combine reports and drafts for display
  const combinedReports = [
    ...reports.map(r => ({ ...r, type: 'report' })),
    ...drafts.map(d => ({ 
      ...d, 
      type: 'draft',
      status: d.full_report && d.full_report.trim() !== '' ? 'completed' : 'draft',
      title: d.title || 'Draft Report'
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredReports = combinedReports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter
    const matchesSearch = searchTerm === '' || 
      (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.practical_title && report.practical_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.unit_name && report.unit_name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'draft':
        return 'Draft'
      default:
        return 'In Progress'
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-700/10 animate-pulse"></div>
        
        {/* Floating Scientific Icons */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 text-cyan-400/20"
        >
          <BookOpen className="h-12 w-12" />
        </motion.div>
        
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-40 right-32 text-purple-400/20"
        >
          <Microscope className="h-16 w-16" />
        </motion.div>
        
        <motion.div
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-32 left-40 text-emerald-400/20"
        >
          <TestTube className="h-10 w-10" />
        </motion.div>
        
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            rotate: [0, -90, -180]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 text-blue-400/20"
        >
          <Beaker className="h-14 w-14" />
        </motion.div>
        
        <motion.div
          animate={{
            x: [0, 90, 0],
            y: [0, -30, 0],
            rotate: [0, 270, 360]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-60 left-1/2 text-violet-400/20"
        >
          <Atom className="h-12 w-12" />
        </motion.div>
        
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 70, 0],
            rotate: [0, -45, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-80 right-1/4 text-yellow-400/20"
        >
          <Zap className="h-8 w-8" />
        </motion.div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-2xl shadow-2xl border border-gray-600 p-4 md:p-8 mb-8 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 md:w-28 md:h-16 mr-3 md:mr-6">
              <motion.img 
                src="/public/SciDraft-symbol-logo.png" 
                alt="SciDraft Logo" 
                className="w-full h-full object-contain"
                animate={{
                  scale: [1, 1.08, 1],
                  rotate: [0, 3, -3, 0],
                  opacity: [0.9, 1, 0.9],
                  filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-white bg-clip-text text-transparent">SciDraft Dashboard</h1>
              <p className="text-cyan-200 mt-1 text-sm md:text-base hidden md:block">Manage your scientific reports and research</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="flex items-center px-2 py-2 md:px-4 md:py-2 text-cyan-200 hover:text-white transition-colors bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-600 hover:border-cyan-400"
            >
              <Settings className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center px-2 py-2 md:px-4 md:py-2 text-cyan-200 hover:text-white transition-colors bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-600 hover:border-cyan-400"
            >
              <LogOut className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back, {userName}!
          </h2>
          <p className="text-green-600">Manage your lab reports, track progress, and draft professional reports.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-blue-600/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-300/20">
                <FileText className="h-6 w-6 text-blue-100" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Reports</p>
                <p className="text-2xl font-bold text-white">{stats.totalReports}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400/30 to-green-600/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-300/20">
                <CheckCircle className="h-6 w-6 text-green-100" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedReports}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-yellow-300/20">
                <Clock className="h-6 w-6 text-yellow-100" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Generated Drafts</p>
                <p className="text-2xl font-bold text-white">{stats.generatedDrafts}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400/30 to-purple-600/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-300/20">
                <TrendingUp className="h-6 w-6 text-purple-100" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Full Reports</p>
                <p className="text-2xl font-bold text-white">{stats.fullReports}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Professional Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Link
            to="/new-report"
            className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Create Report</h3>
              <p className="text-cyan-100 text-sm opacity-90">Start your next scientific breakthrough</p>
            </div>
          </Link>

          <Link
            to="/my-reports"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reports</h3>
              <p className="text-emerald-100 text-sm opacity-90">Access your research library</p>
            </div>
          </Link>
        </motion.div>

        {/* Recent Reports */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-300"
        >
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white md:block hidden">Recent Reports</h3>
              <h3 className="text-lg font-semibold text-white md:hidden">Reports</h3>
              
              <div className="flex items-center space-x-4">
                {/* Desktop Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-white/50 w-64"
                  />
                </div>
                
                {/* Mobile Search */}
                <div className="md:hidden relative">
                  {!isSearchExpanded ? (
                    <button
                      onClick={() => setIsSearchExpanded(true)}
                      className="p-2 text-cyan-200 hover:text-white transition-colors bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-600 hover:border-cyan-400"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 w-40 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-white/50"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          setIsSearchExpanded(false);
                          setSearchTerm('');
                        }}
                        className="p-2 text-cyan-200 hover:text-white transition-colors bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-600 hover:border-cyan-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-white/70" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white"
                  >
                    <option value="all" className="text-black bg-white">All Reports</option>
                    <option value="completed" className="text-black bg-white">Completed</option>
                    <option value="draft" className="text-black bg-white">Drafts</option>
                  </select>
                </div>
                
                <Link
                  to="/reports"
                  className="text-sm text-cyan-300 hover:text-cyan-100 font-medium"
                >
                  <span className="hidden md:inline">View All</span>
                  <span className="md:hidden">All</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-white/60 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">
                  {filter === 'all' ? 'No reports yet' : `No ${filter} reports`}
                </h4>
                <p className="text-white/70 mb-6">
                  {filter === 'all' 
                    ? 'Create your first lab report to get started'
                    : `You don't have any ${filter} reports yet`
                  }
                </p>
                <Link
                  to="/new-report"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Report
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.slice(0, 5).map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(report.status)}
                      
                      <div>
                        <h4 className="font-medium text-white">
                          {report.title || 'Untitled Report'}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-white/70">
                          <span>{getStatusText(report.status)}</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          {report.practicals && (
                            <>
                              <span>•</span>
                              <span>{report.practicals.units?.subject}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={report.type === 'draft' ? `/draft-viewer/${report.session_id}` : `/report-viewer/${report.session_id}`}
                        className="p-2 text-white/60 hover:text-white transition-colors"
                        title={report.type === 'draft' ? 'View Draft' : 'View Report'}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      
                      {report.status === 'completed' && (
                        <button
                          className="p-2 text-white/60 hover:text-white transition-colors"
                          title="Download Report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>


        </div>
      </div>
      
      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}