-- Temporarily disable RLS to test if the trigger is working
-- This will help us isolate whether the issue is with the trigger or RLS policies

-- Disable RLS temporarily for debugging
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Check if the trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Re-enable RLS after testing
-- (This will be done in a separate migration after testing)