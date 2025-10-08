-- Fix RLS policies to allow anonymous access to drafts
-- This addresses the issue where anonymous users cannot view drafts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can insert their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow access to drafts by session_id" ON public.drafts;

-- Create new policies that allow anonymous access based on session_id
-- Policy for SELECT: Allow access if user owns the draft OR user_id is NULL (anonymous) OR admin
CREATE POLICY "Allow draft access by ownership or session" ON public.drafts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policy for INSERT: Allow authenticated users to insert their own drafts, and anonymous users
CREATE POLICY "Allow draft insertion" ON public.drafts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id IS NULL
  );

-- Policy for UPDATE: Allow users to update their own drafts OR anonymous drafts by session_id
CREATE POLICY "Allow draft updates by ownership or session" ON public.drafts
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policy for DELETE: Allow users to delete their own drafts
CREATE POLICY "Allow draft deletion by owner" ON public.drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure proper permissions are granted
GRANT SELECT ON public.drafts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.drafts TO anon, authenticated;
GRANT DELETE ON public.drafts TO authenticated;

-- Add comment for documentation
COMMENT ON POLICY "Allow draft access by ownership or session" ON public.drafts IS 'Allows authenticated users to access their own drafts, anonymous users to access drafts with NULL user_id, and admins to access all drafts';