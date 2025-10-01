-- Fix RLS policies for users table to allow proper signup flow
-- This ensures both trigger and authenticated user operations work correctly

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow trigger user insertion" ON public.users;
DROP POLICY IF EXISTS "Allow user signup" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create comprehensive RLS policies for users table

-- 1. Allow system/trigger to insert new users (for signup process)
CREATE POLICY "System can insert users" ON public.users
  FOR INSERT
  WITH CHECK (
    -- Allow if no current user (system/trigger context)
    auth.uid() IS NULL OR
    -- Allow if inserting own profile
    auth.uid() = id
  );

-- 2. Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (
    auth.uid() = id OR
    public.is_admin()
  );

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 4. Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant necessary permissions to roles
GRANT INSERT, SELECT, UPDATE ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO service_role;

-- Ensure the trigger function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;