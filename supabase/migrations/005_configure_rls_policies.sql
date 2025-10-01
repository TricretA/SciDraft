-- Configure Row Level Security (RLS) policies for all tables

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can view all users" ON users
  FOR SELECT USING (public.is_teacher());

-- Units table policies
CREATE POLICY "Anyone can view units" ON units
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage units" ON units
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can manage units" ON units
  FOR ALL USING (public.is_teacher());

-- Practicals table policies
CREATE POLICY "Anyone can view practicals" ON practicals
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage practicals" ON practicals
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can manage practicals" ON practicals
  FOR ALL USING (public.is_teacher());

-- Manual templates table policies
CREATE POLICY "Anyone can view manual templates" ON manual_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage manual templates" ON manual_templates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can manage manual templates" ON manual_templates
  FOR ALL USING (public.is_teacher());

-- Manual versions table policies
CREATE POLICY "Anyone can view manual versions" ON manual_versions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage manual versions" ON manual_versions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can manage manual versions" ON manual_versions
  FOR ALL USING (public.is_teacher());

-- Reports table policies
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Users can create their own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON reports
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Admins can manage all reports" ON reports
    FOR ALL USING (public.is_admin());

-- Report drawings table policies
CREATE POLICY "Users can view their own report drawings" ON report_drawings
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM reports r WHERE r.id = report_drawings.report_id AND (r.user_id = auth.uid() OR public.is_admin() OR public.is_teacher())
    ));

CREATE POLICY "Users can create drawings for their own reports" ON report_drawings
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM reports r WHERE r.id = report_drawings.report_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can update drawings for their own reports" ON report_drawings
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM reports r WHERE r.id = report_drawings.report_id AND (r.user_id = auth.uid() OR public.is_admin() OR public.is_teacher())
    ));

CREATE POLICY "Admins can manage all report drawings" ON report_drawings
    FOR ALL USING (public.is_admin());

-- Exports table policies
CREATE POLICY "Users can view their own exports" ON exports
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM reports r WHERE r.id = exports.report_id AND (r.user_id = auth.uid() OR public.is_admin() OR public.is_teacher())
    ));

CREATE POLICY "Users can create exports for their own reports" ON exports
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM reports r WHERE r.id = exports.report_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all exports" ON exports
    FOR ALL USING (public.is_admin());

-- Payments table policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can view all payments" ON payments
  FOR SELECT USING (public.is_teacher());

-- Feedback table policies
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" ON feedback
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can view all feedback" ON feedback
  FOR SELECT USING (public.is_teacher());

-- Prompts table policies
CREATE POLICY "Anyone can view prompts" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage prompts" ON prompts
  FOR ALL USING (public.is_admin());

-- Admin logs table policies
CREATE POLICY "Admins can manage admin logs" ON admin_logs
  FOR ALL USING (public.is_admin());

-- Support requests table policies
CREATE POLICY "Users can view their own support requests" ON support_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support requests" ON support_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support requests" ON support_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all support requests" ON support_requests
  FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can view all support requests" ON support_requests
  FOR SELECT USING (public.is_teacher());

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (public.is_admin());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications for any user