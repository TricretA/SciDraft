-- Comprehensive RLS Policy Audit and Enforcement
-- This migration ensures all tables have proper Row Level Security policies

-- Drop existing policies to recreate them with proper security
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

DROP POLICY IF EXISTS "Users can view approved templates" ON manual_templates;
DROP POLICY IF EXISTS "Lecturers can upload templates" ON manual_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON manual_templates;

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

DROP POLICY IF EXISTS "Users can view own report drawings" ON report_drawings;
DROP POLICY IF EXISTS "Users can create report drawings" ON report_drawings;
DROP POLICY IF EXISTS "Admins can view all report drawings" ON report_drawings;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

DROP POLICY IF EXISTS "Admins can view prompts" ON prompts;
DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;

DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can create admin logs" ON admin_logs;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own drafts" ON drafts;
DROP POLICY IF EXISTS "Users can create drafts" ON drafts;
DROP POLICY IF EXISTS "Admins can view all drafts" ON drafts;

DROP POLICY IF EXISTS "Only admins can access" ON admins;
DROP POLICY IF EXISTS "Admins can view other admins" ON admins;

-- USERS TABLE POLICIES
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- MANUAL TEMPLATES POLICIES
CREATE POLICY "Users can view approved templates" ON manual_templates
  FOR SELECT USING (approved = true);

CREATE POLICY "Lecturers can upload templates" ON manual_templates
  FOR INSERT WITH CHECK (
    auth.uid()::text = uploaded_by::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('lecturer', 'admin')
    )
  );

CREATE POLICY "Lecturers can update own templates" ON manual_templates
  FOR UPDATE USING (
    auth.uid()::text = uploaded_by::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('lecturer', 'admin')
    )
  );

CREATE POLICY "Admins can manage all templates" ON manual_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- REPORTS POLICIES
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- REPORT DRAWINGS POLICIES
CREATE POLICY "Users can view own report drawings" ON report_drawings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_drawings.report_id 
      AND (reports.user_id::text = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM admins 
             WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
           ))
    )
  );

CREATE POLICY "Users can create report drawings" ON report_drawings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_drawings.report_id 
      AND reports.user_id::text = auth.uid()::text
    )
  );

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- FEEDBACK POLICIES
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- PROMPTS POLICIES (Admin only)
CREATE POLICY "Admins can view prompts" ON prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage prompts" ON prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ADMIN LOGS POLICIES (Admin only)
CREATE POLICY "Admins can view admin logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can create admin logs" ON admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- DRAFTS POLICIES
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

-- ADMINS POLICIES (Super secure - admin table access)
CREATE POLICY "Only admins can access" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Grant necessary permissions to roles
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT, UPDATE ON users TO authenticated;

GRANT SELECT ON manual_templates TO anon, authenticated;
GRANT INSERT, UPDATE ON manual_templates TO authenticated;

GRANT SELECT, INSERT, UPDATE ON reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON report_drawings TO authenticated;
GRANT SELECT, INSERT ON payments TO authenticated;
GRANT SELECT, INSERT ON feedback TO authenticated;

GRANT SELECT ON prompts TO authenticated;
GRANT SELECT, INSERT ON admin_logs TO authenticated;

GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON drafts TO authenticated;

GRANT SELECT ON admins TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create function to check admin status (reusable)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users 
    WHERE id::text = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;