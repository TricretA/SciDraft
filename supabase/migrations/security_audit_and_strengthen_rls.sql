-- Security Audit and Strengthen RLS Policies
-- This migration addresses critical security vulnerabilities in RLS policies

-- 1. Fix admin authentication functions to check both users and admins tables
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is admin in users table OR in admins table
  RETURN (
    SELECT COALESCE(
      (SELECT role IN ('admin', 'super_admin') FROM public.users WHERE id = auth.uid()),
      (SELECT role IN ('admin', 'super_admin', 'Shem', 'Vanessa', 'Wazimu') FROM public.admins WHERE id = auth.uid()),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (SELECT role = 'super_admin' FROM public.users WHERE id = auth.uid()),
      (SELECT role IN ('Wazimu') FROM public.admins WHERE id = auth.uid()),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Strengthen admins table security - remove anonymous access
DROP POLICY IF EXISTS "Allow anon read access for authentication" ON "public"."admins";
DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."admins";

-- Only allow admins to manage admins table
CREATE POLICY "Only admins can view admins" ON "public"."admins"
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Only super admins can manage admins" ON "public"."admins"
  FOR ALL USING (public.is_super_admin());

-- 4. Add missing admin policies for drafts table
CREATE POLICY "Admins can view all drafts" ON public.drafts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all drafts" ON public.drafts
  FOR ALL USING (public.is_admin());

-- 5. Strengthen units table - remove anonymous access
DROP POLICY IF EXISTS "Anyone can view units" ON units;
CREATE POLICY "Authenticated users can view units" ON units
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Strengthen practicals table - remove anonymous access  
DROP POLICY IF EXISTS "Anyone can view practicals" ON practicals;
CREATE POLICY "Authenticated users can view practicals" ON practicals
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Strengthen manual templates - remove anonymous access
DROP POLICY IF EXISTS "Anyone can view manual templates" ON manual_templates;
CREATE POLICY "Authenticated users can view manual templates" ON manual_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Strengthen manual versions - remove anonymous access
DROP POLICY IF EXISTS "Anyone can view manual versions" ON manual_versions;
CREATE POLICY "Authenticated users can view manual versions" ON manual_versions
  FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Strengthen prompts table - only admins should manage
DROP POLICY IF EXISTS "Anyone can view prompts" ON prompts;
CREATE POLICY "Authenticated users can view prompts" ON prompts
  FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Add session-based access for anonymous users to specific tables needed for report generation
-- Allow anonymous access to units for report creation
CREATE POLICY "Anonymous users can view units for reports" ON units
  FOR SELECT TO anon USING (true);

-- Allow anonymous access to manual templates for report creation
CREATE POLICY "Anonymous users can view manual templates for reports" ON manual_templates
  FOR SELECT TO anon USING (true);

-- 11. Revoke unnecessary permissions from anon role
REVOKE SELECT ON "public"."admins" FROM anon;
REVOKE ALL ON "public"."admin_logs" FROM anon;
REVOKE ALL ON "public"."support_requests" FROM anon;
REVOKE ALL ON "public"."feedback" FROM anon;
REVOKE ALL ON "public"."payments" FROM anon;

-- 12. Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 13. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_logs (admin_id, action, details, created_at)
    VALUES (auth.uid(), TG_OP || ' on ' || TG_TABLE_NAME, row_to_json(OLD), NOW());
    RETURN OLD;
  ELSE
    INSERT INTO public.admin_logs (admin_id, action, details, created_at)
    VALUES (auth.uid(), TG_OP || ' on ' || TG_TABLE_NAME, row_to_json(NEW), NOW());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for sensitive tables
CREATE TRIGGER audit_admins_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_prompts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- 14. Add rate limiting for sensitive operations (conceptual - would need additional implementation)
-- This would require additional tables and functions for rate limiting

-- 15. Ensure all tables have proper RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Checks if current user is admin in either users or admins table';
COMMENT ON FUNCTION public.is_super_admin() IS 'Checks if current user is super admin with elevated privileges';
COMMENT ON FUNCTION public.log_admin_action() IS 'Logs all admin actions for audit trail';