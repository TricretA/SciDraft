-- Fix the handle_new_user function to properly handle UUID generation
-- This addresses the conflict between auth.uid() and the table's default UUID generation

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new user profile with explicit ID from auth.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    active_plan
  )
  VALUES (
    NEW.id,  -- Use the ID from auth.users directly
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'student',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Ensure proper permissions on users table for the trigger
GRANT INSERT, SELECT, UPDATE ON public.users TO service_role;
GRANT INSERT, SELECT, UPDATE ON public.users TO postgres;

-- Add a policy to allow the trigger to insert users
DROP POLICY IF EXISTS "Allow trigger user insertion" ON public.users;
CREATE POLICY "Allow trigger user insertion" ON public.users
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts from the trigger context

-- Ensure anon role can still perform necessary operations
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA auth TO anon;