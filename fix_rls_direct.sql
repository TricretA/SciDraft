-- Direct RLS fix for manual templates - execute this directly in Supabase dashboard
-- This will fix the RLS issues preventing users from saving manuals

-- 1. Enable RLS on manual_templates if not already enabled
ALTER TABLE public.manual_templates ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Users can view their own manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can view all manual templates" ON public.manual_templates;
DROP POLICY IF EXISTS "Admins can update manual templates" ON public.manual_templates;

-- 3. Create the is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- 4. Create essential RLS policies for manual_templates
CREATE POLICY "Users can insert own manual templates" ON public.manual_templates
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can select own manual templates" ON public.manual_templates
    FOR SELECT TO authenticated
    USING (auth.uid() = uploaded_by);

-- 5. Grant necessary permissions
GRANT SELECT, INSERT ON public.manual_templates TO authenticated;