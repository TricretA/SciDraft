-- Add RLS policy to allow anonymous access to reports by session_id
-- This is needed for the full report generation flow where anonymous users
-- can generate and view reports using their session_id

-- Drop existing restrictive policies for reports
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;

-- Create new policies that allow session-based access
CREATE POLICY "Allow access to reports by session_id or user_id" ON public.reports
  FOR ALL USING (
    -- Allow if user owns the report (authenticated users)
    (auth.uid() = user_id) OR 
    -- Allow anonymous access when user_id is null (anonymous users with session_id)
    (user_id IS NULL) OR
    -- Allow admin and teacher access
    (public.is_admin()) OR 
    (public.is_teacher())
  );

-- Ensure anonymous users can access reports table
GRANT SELECT, INSERT, UPDATE ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;