import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
  })
  // Create a dummy client to prevent app crash
  supabaseClient = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient

// Database types based on the schema
export interface User {
  id: string
  email: string
  name?: string
  role: 'student' | 'lecturer' | 'admin'
  active_plan: 'free' | 'one_time' | 'pack' | 'semester'
  expires_at?: string
  preferred_mpesa_number?: string
  created_at: string
  last_login?: string
}

export interface Unit {
  id: string
  code: string
  name: string
  subject: 'Biology' | 'Chemistry' | 'Physics'
  created_at: string
}

export interface Practical {
  id: string
  unit_id: string
  number: number
  title: string
  created_at: string
}

export interface ManualTemplate {
  id: string
  practical_id: string
  manual_url: string
  manual_hash: string
  parsed_text: any
  materials?: string
  procedure?: string
  approved: boolean
  uploaded_by: string
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string
  practical_id: string
  manual_id?: string
  title: string
  objectives?: string
  hypothesis?: string
  results_json: any
  draft_json: any
  status: 'draft_limited' | 'full_report' | 'exported' | 'failed' | 'draft' | 'completed'
  created_at: string
  updated_at: string
}

export interface ReportDrawing {
  id: string
  report_id: string
  file_url: string
  description?: string
  created_at: string
}

export interface Export {
  id: string
  report_id: string
  format: 'pdf' | 'docx'
  url: string
  paid: boolean
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  method: 'mpesa' | 'stripe'
  status: 'pending' | 'success' | 'failed'
  transaction_id?: string
  created_at: string
}