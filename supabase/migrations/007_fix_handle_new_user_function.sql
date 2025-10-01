-- Fix handle_new_user function security and permissions
-- This resolves the "Function public.handle_new_user has a role mutable" error

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new user record with proper error handling
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    role, 
    created_at, 
    last_login
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'student'::user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with proper settings
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Ensure proper permissions for user creation
GRANT INSERT ON public.users TO service_role;
GRANT SELECT ON public.users TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile on auth.users insert. Uses SECURITY DEFINER with restricted search_path for security.';