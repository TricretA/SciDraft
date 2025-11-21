import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  MessageSquare,
  Search,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react'

interface Feedback {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user_email?: string
  user_name?: string
}

function AdminFeedbackComponent() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    console.log('AdminFeedback component mounted, fetching feedback...')
    fetchFeedback()
  }, [])

  useEffect(() => {
    console.log('Filter/sort dependencies changed:', {
      feedbackLength: feedback.length,
      searchTerm,
      ratingFilter,
      sortBy,
      sortOrder
    })
    filterAndSortFeedback()
  }, [feedback, searchTerm, ratingFilter, sortBy, sortOrder])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      console.log('Starting to fetch feedback...')
      
      // First, fetch all feedback data
      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Raw feedback data from Supabase:', feedbackData)
      console.log('Feedback error:', error)

      if (error) {
        console.error('Error fetching feedback:', error)
        throw error
      }
      
      if (!feedbackData || feedbackData.length === 0) {
        console.log('No feedback data found')
        setFeedback([])
        return
      }

      console.log(`Found ${feedbackData.length} feedback items`)

      // Get unique user IDs to fetch user data
      const userIds = [...new Set(feedbackData.map(fb => fb.user_id))]
      console.log('User IDs to fetch:', userIds)
      
      // Fetch user data for all unique user IDs
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds)

      console.log('Users data:', usersData)
      console.log('Users error:', usersError)

      if (usersError) {
        console.warn('Could not fetch user data:', usersError)
      }

      // Create a map of user data for quick lookup
      const usersMap = new Map()
      if (usersData) {
        usersData.forEach(user => {
          usersMap.set(user.id, user)
        })
      }

      console.log('Users map created:', Array.from(usersMap.entries()))

      // Combine feedback with user data
      const feedbackWithUserInfo: Feedback[] = feedbackData.map(fb => {
        const userData = usersMap.get(fb.user_id)
        const feedbackItem = {
          ...fb,
          user_email: userData?.email || 'Unknown',
          user_name: userData?.name || 'Unknown User'
        }
        console.log('Processed feedback item:', feedbackItem)
        return feedbackItem
      })

      console.log('Final feedback with user info:', feedbackWithUserInfo)
      setFeedback(feedbackWithUserInfo)
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setFeedback([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortFeedback = () => {
    console.log('Starting filterAndSortFeedback with feedback length:', feedback.length)
    let filtered = feedback

    console.log('Before filtering:', filtered.length)

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fb => 
        fb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    console.log('After search filter:', filtered.length)

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(fb => fb.rating === parseInt(ratingFilter))
    }

    console.log('After rating filter:', filtered.length)

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'rating':
          aValue = a.rating
          bValue = b.rating
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    console.log('After sorting:', filtered.length)
    setFilteredFeedback(filtered)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFeedback = filteredFeedback.slice(startIndex, endIndex)

  console.log('Render state:', {
    loading,
    feedbackLength: feedback.length,
    filteredFeedbackLength: filteredFeedback.length,
    currentFeedbackLength: currentFeedback.length,
    totalPages,
    currentPage
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600">Monitor user feedback and ratings</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="rating">Rating</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USER ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RATING</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentFeedback.map((fb) => (
                <tr key={fb.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fb.user_name || fb.user_email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {fb.user_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {renderStars(fb.rating)}
                      <span className="text-sm text-gray-600">({fb.rating})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 line-clamp-3">
                        {fb.comment || 'No comment provided'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(fb.created_at)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {currentFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || ratingFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No feedback has been submitted yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50/80 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredFeedback.length)}</span> of{' '}
                  <span className="font-medium">{filteredFeedback.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Admin role protection removed
export const AdminFeedback = AdminFeedbackComponent
