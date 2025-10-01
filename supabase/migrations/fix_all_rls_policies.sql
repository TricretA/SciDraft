-- Fix All Supabase RLS Policies
-- This migration resolves all "Permission denied" errors and ensures proper access control

-- Begin transaction
BEGIN;

-- 1. GRANT BASIC PERMISSIONS TO ROLES
-- These are essential for basic operations
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant table permissions for anon role (for signup/public access)
GRANT SELECT ON public.users TO anon;
GRANT INSERT ON public.users TO anon;
GRANT SELECT ON public.manual_templates TO anon;
GRANT INSERT ON public.reports TO anon;
GRANT INSERT ON public.report_drawings TO anon;
GRANT SELECT ON public.prompts TO anon;
GRANT INSERT ON public.drafts TO anon;
GRANT INSERT ON public.profiles TO anon;

-- Grant comprehensive permissions for authenticated users
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.manual_templates TO authenticated;
GRANT ALL PRIVILEGES ON public.reports TO authenticated;
GRANT ALL PRIVILEGES ON public.report_drawings TO authenticated;
GRANT ALL PRIVILEGES ON public.payments TO authenticated;
GRANT ALL PRIVILEGES ON public.feedback TO authenticated;
GRANT ALL PRIVILEGES ON public.prompts TO authenticated;
GRANT ALL PRIVILEGES ON public.admin_logs TO authenticated;
GRANT ALL PRIVILEGES ON public.notifications TO authenticated;
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.drafts TO authenticated;
GRANT ALL PRIVILEGES ON public.admins TO authenticated;

-- 2. ENSURE RLS IS ENABLED ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL EXISTING POLICIES TO START FRESH
-- Users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Allow public signup" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Manual templates
DROP POLICY IF EXISTS "Users can view approved templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Users can view approved manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Lecturers can upload templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Lecturers can update own templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Only admins can approve templates" ON public.manual_templates;

-- Reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can manage their own reports" ON public.reports;
DROP POLICY IF EXISTS "Rate limit report creation" ON public.reports;
DROP POLICY IF EXISTS "Allow anonymous report creation" ON public.reports;

-- Report drawings
DROP POLICY IF EXISTS "Users can view own report drawings" ON public.report_drawings;
DROP POLICY IF EXISTS "Users can create report drawings" ON public.report_drawings;

-- Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Only system can create payments" ON public.payments;

-- Feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can manage feedback for their reports" ON public.feedback;

-- Prompts
DROP POLICY IF EXISTS "Admins can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Admins can manage prompts" ON public.prompts;
DROP POLICY IF EXISTS "Allow public read access to prompts" ON public.prompts;

-- Admin logs
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can create admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can manage admin logs" ON public.admin_logs;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public profile creation" ON public.profiles;

-- Drafts
DROP POLICY IF EXISTS "Users can view own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can create drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Admins can manage all drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow anonymous draft creation" ON public.drafts;

-- Admins
DROP POLICY IF EXISTS "Only admins can access" ON public.admins;
DROP POLICY IF EXISTS "Admins can view other admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins can manage all admin records" ON public.admins;
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admins;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to read admins" ON public.admins;
DROP POLICY IF EXISTS "Allow read access to admins table" ON public.admins;

-- 4. CREATE HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in admins table OR has admin role in users table
  RETURN (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- 5. CREATE COMPREHENSIVE RLS POLICIES

-- USERS TABLE POLICIES
-- Allow public signup
CREATE POLICY "Allow public signup" ON public.users
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Users can view and update their own profile
CREATE POLICY "Users can manage own profile" ON public.users
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MANUAL TEMPLATES POLICIES
-- Public can view approved templates
CREATE POLICY "Public can view approved templates" ON public.manual_templates
  FOR SELECT TO anon, authenticated
  USING (approved = true);

-- Authenticated users can upload templates
CREATE POLICY "Users can upload templates" ON public.manual_templates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.manual_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates" ON public.manual_templates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- REPORTS POLICIES
-- Allow anonymous report creation (for guest users)
CREATE POLICY "Allow anonymous report creation" ON public.reports
  FOR INSERT TO anon
  WITH CHECK (true);

-- Users can manage their own reports
CREATE POLICY "Users can manage own reports" ON public.reports
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid()::text = session_id::text OR
    public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid()::text = session_id::text OR
    public.is_admin()
  );

-- REPORT DRAWINGS POLICIES
-- Allow anonymous creation
CREATE POLICY "Allow anonymous report drawings" ON public.report_drawings
  FOR INSERT TO anon
  WITH CHECK (true);

-- Users can manage drawings for their reports
CREATE POLICY "Users can manage own report drawings" ON public.report_drawings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_drawings.report_id 
      AND (reports.user_id = auth.uid() OR reports.session_id::text = auth.uid()::text)
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_drawings.report_id 
      AND (reports.user_id = auth.uid() OR reports.session_id::text = auth.uid()::text)
    ) OR public.is_admin()
  );

-- PAYMENTS POLICIES
-- Users can view and create their own payments
CREATE POLICY "Users can manage own payments" ON public.payments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- FEEDBACK POLICIES
-- Users can manage feedback for their reports
CREATE POLICY "Users can manage own feedback" ON public.feedback
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = feedback.report_id 
      AND reports.user_id = auth.uid()
    ) OR
    public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = feedback.report_id 
      AND reports.user_id = auth.uid()
    ) OR
    public.is_admin()
  );

-- PROMPTS POLICIES
-- Allow public read access to prompts (needed for report generation)
CREATE POLICY "Allow public read access to prompts" ON public.prompts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can modify prompts
CREATE POLICY "Admins can insert prompts" ON public.prompts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update prompts" ON public.prompts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete prompts" ON public.prompts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ADMIN LOGS POLICIES
-- Only admins can access admin logs
CREATE POLICY "Admins can manage admin logs" ON public.admin_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS POLICIES
-- Users can manage their own notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- PROFILES POLICIES
-- Allow public profile creation (for signup)
CREATE POLICY "Allow public profile creation" ON public.profiles
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- DRAFTS POLICIES
-- Allow anonymous draft creation
CREATE POLICY "Allow anonymous draft creation" ON public.drafts
  FOR INSERT TO anon
  WITH CHECK (true);

-- Users can manage their own drafts
CREATE POLICY "Users can manage own drafts" ON public.drafts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ADMINS POLICIES
-- Only authenticated users who are admins can access admin table
CREATE POLICY "Only admins can access admin table" ON public.admins
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. CREATE TRIGGER FUNCTIONS FOR AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user record
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'student',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Success message
SELECT 'All RLS policies have been successfully updated!' as message;