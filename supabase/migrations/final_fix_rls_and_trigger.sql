-- Final fix: Re-enable RLS and create proper policies for trigger functionality

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow trigger user insertion" ON public.users;
DROP POLICY IF EXISTS "Allow system insert" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins manage all" ON public.users;

-- Create comprehensive RLS policies
-- Policy 1: Allow system/trigger to insert users (no auth context required)
CREATE POLICY "Allow system insert" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role full access (for admin operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT INSERT, SELECT, UPDATE ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO service_role;

-- Ensure trigger function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Verify the trigger is still active
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';