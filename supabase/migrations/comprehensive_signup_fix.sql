-- Comprehensive fix for user signup trigger and RLS policies
-- This addresses the "Database error saving new user" issue

-- First, drop existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing RLS policies on users table
DROP POLICY IF EXISTS "trigger_insert" ON public.users;
DROP POLICY IF EXISTS "user_select" ON public.users;
DROP POLICY IF EXISTS "user_update" ON public.users;
DROP POLICY IF EXISTS "Allow system insert" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Create the trigger function with proper security and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table using the new user's data from auth.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    active_plan,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'New User'),
    'student',
    'free',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Ensure proper table permissions
GRANT ALL PRIVILEGES ON public.users TO postgres;
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.users TO anon;

-- Create comprehensive RLS policies for users table
-- Policy 1: Allow system/trigger inserts (when no current user context)
CREATE POLICY "system_insert_users" ON public.users
  FOR INSERT
  WITH CHECK (
    -- Allow if no current user (system/trigger context) OR if inserting own record
    auth.uid() IS NULL OR auth.uid() = id
  );

-- Policy 2: Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role has full access (for admin operations)
CREATE POLICY "service_role_full_access" ON public.users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add updated_at column if it doesn't exist and create update trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the updated_at trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify the setup
SELECT 'Trigger setup completed successfully' as status;

-- Show current policies for verification
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'users'
ORDER BY policyname;