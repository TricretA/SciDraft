-- Final comprehensive RLS fix for manual saving issues
-- This migration fixes all RLS policies related to manual templates and ensures users can save manuals

-- 1. First, ensure RLS is enabled on manual_templates
ALTER TABLE public.manual_templates ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Users can view their own manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can view all manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can update manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Public can view approved templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Users can upload templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.manual_templates;

-- 3. Ensure the is_admin function exists and is working
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

-- Grant execute permission on is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 4. Create comprehensive RLS policies for manual_templates

-- Allow authenticated users to insert their own manual templates
CREATE POLICY "Users can insert own manual templates" ON public.manual_templates
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

-- Allow authenticated users to select their own manual templates
CREATE POLICY "Users can select own manual templates" ON public.manual_templates
    FOR SELECT TO authenticated
    USING (auth.uid() = uploaded_by);

-- Allow authenticated users to update their own manual templates
CREATE POLICY "Users can update own manual templates" ON public.manual_templates
    FOR UPDATE TO authenticated
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to view approved templates (public access)
CREATE POLICY "Public can view approved templates" ON public.manual_templates
    FOR SELECT TO anon, authenticated
    USING (approved = true);

-- Allow admins to manage all manual templates
CREATE POLICY "Admins can manage all manual templates" ON public.manual_templates
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Ensure proper grants are set
GRANT SELECT, INSERT, UPDATE ON public.manual_templates TO authenticated;
GRANT SELECT ON public.manual_templates TO anon;

-- 6. Ensure users table RLS is properly configured for role checking
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Grant necessary permissions on related tables
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.admins TO authenticated;

-- 8. Add helpful comment for debugging
COMMENT ON POLICY "Users can insert own manual templates" ON public.manual_templates IS 'Allows authenticated users to insert manual templates they uploaded';
COMMENT ON POLICY "Users can select own manual templates" ON public.manual_templates IS 'Allows authenticated users to view their own manual templates';
COMMENT ON FUNCTION public.is_admin() IS 'Checks if current user is admin by checking both admins table and users.role';