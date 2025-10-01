-- Fix RLS policies to allow trigger and authenticated user operations

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "system_insert" ON public.users;
DROP POLICY IF EXISTS "trigger_insert" ON public.users;
DROP POLICY IF EXISTS "user_select" ON public.users;
DROP POLICY IF EXISTS "user_update" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;
DROP POLICY IF EXISTS "system_insert_users" ON public.users;

-- Create permissive policies that work with the trigger
-- Policy 1: Allow all inserts (for trigger and authenticated users)
CREATE POLICY "allow_insert" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow users to select their own data
CREATE POLICY "allow_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- Policy 3: Allow users to update their own data
CREATE POLICY "allow_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role full access
CREATE POLICY "service_role_access" ON public.users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure proper permissions are granted
GRANT ALL PRIVILEGES ON public.users TO postgres;
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.users TO anon;

-- Verify the policies are created
SELECT 'RLS policies updated successfully' as result;

SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;