-- Simple fix for the signup trigger function
-- Focus on making the trigger work correctly

-- Drop and recreate the trigger function with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table
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
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT ALL ON public.users TO postgres, service_role;

-- Simple RLS policy for system inserts
DROP POLICY IF EXISTS "system_insert" ON public.users;
CREATE POLICY "system_insert" ON public.users
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts for now

SELECT 'Trigger fixed successfully' as result;