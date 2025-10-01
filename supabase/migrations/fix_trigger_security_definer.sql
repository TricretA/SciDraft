-- Fix trigger function to run with elevated privileges and bypass RLS

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- This makes the function run with the privileges of the function owner
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
    active_plan
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'student',
    'free'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate insertions
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions to ensure the trigger can run
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Ensure the function owner (postgres) has full access to users table
GRANT ALL PRIVILEGES ON public.users TO postgres;

-- Also create a simple policy that allows inserts when there's no current user (system context)
DROP POLICY IF EXISTS "trigger_insert" ON public.users;
CREATE POLICY "trigger_insert" ON public.users 
  FOR INSERT 
  WITH CHECK (
    -- Allow if no current user (system/trigger context) OR if inserting own record
    auth.uid() IS NULL OR auth.uid() = id
  );