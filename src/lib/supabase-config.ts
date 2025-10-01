import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Enhanced Supabase client configuration with connection pooling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Performance monitoring
interface QueryMetrics {
  queryCount: number
  totalTime: number
  slowQueries: Array<{ query: string; time: number; timestamp: Date }>
}

const queryMetrics: QueryMetrics = {
  queryCount: 0,
  totalTime: 0,
  slowQueries: []
}

// Enhanced Supabase client configuration with performance optimizations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto refresh tokens
    autoRefreshToken: true,
    // Detect session in URL
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: 'scidraft-auth-token',
  },
  db: {
    // Connection pooling configuration
    schema: 'public',
  },
  realtime: {
    // Optimize realtime connections
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'scidraft-web@1.0.0',
    },
  },
})

// Connection pool configuration for server-side usage
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'scidraft-server@1.0.0',
      },
    },
  })
}

// Query optimization helpers
export const queryHelpers = {
  // Paginated queries with proper indexing
  getPaginatedReports: (userId: string, page: number = 1, limit: number = 10) => {
    const offset = (page - 1) * limit
    return supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  },

  // Optimized search queries
  searchReports: (userId: string, searchTerm: string) => {
    return supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .textSearch('title', searchTerm)
      .order('created_at', { ascending: false })
  },

  // Batch operations for better performance
  batchInsertReports: (reports: any[]) => {
    return supabase
      .from('reports')
      .insert(reports)
  },

  // Optimized joins
  getReportsWithPracticals: (userId: string) => {
    return supabase
      .from('reports')
      .select(`
        *,
        practicals (
          id,
          title,
          number,
          units (
            code,
            name,
            subject
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },
}

// Track query performance
const trackQuery = (queryId: string, query: string) => {
  const startTime = Date.now()
  queryMetrics.queryCount++
  
  return () => {
    const endTime = Date.now()
    const duration = endTime - startTime
    queryMetrics.totalTime += duration
    
    // Track slow queries (>1000ms)
    if (duration > 1000) {
      queryMetrics.slowQueries.push({
        query: query.substring(0, 100) + '...',
        time: duration,
        timestamp: new Date()
      })
      
      // Keep only last 50 slow queries
      if (queryMetrics.slowQueries.length > 50) {
        queryMetrics.slowQueries.shift()
      }
    }
  }
}

// Performance monitoring
export const performanceMonitor = {
  // Track query performance
  trackQuery: async (queryName: string, queryFn: () => Promise<any>) => {
    const startTime = performance.now()
    try {
      const result = await queryFn()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  },

  // Connection health check
  healthCheck: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single()
      
      return { healthy: !error, error }
    } catch (error) {
      return { healthy: false, error }
    }
  },
}

// Cache management for frequently accessed data
export const cacheManager = {
  // Simple in-memory cache with TTL
  cache: new Map<string, { data: any; expires: number }>(),
  
  get: (key: string) => {
    const item = cacheManager.cache.get(key)
    if (!item || item.expires < Date.now()) {
      cacheManager.cache.delete(key)
      return null
    }
    return item.data
  },
  
  set: (key: string, data: any, ttlMs: number = 300000) => { // 5 minutes default
    cacheManager.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    })
  },
  
  clear: () => {
    cacheManager.cache.clear()
  },
}

// Export the original supabase client for backward compatibility
export { supabase as default }