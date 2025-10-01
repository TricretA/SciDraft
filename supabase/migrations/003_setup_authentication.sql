-- Setup Supabase Authentication and User Roles

-- Enable email confirmation (optional - can be disabled for development)
-- This is typically configured in Supabase Dashboard under Authentication > Settings

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, last_login)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    'student'::user_role, -- Default role is student
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user's last_login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login_column()
RETURNS trigger AS $$
BEGIN
  NEW.last_login = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_login on user changes
DROP TRIGGER IF EXISTS update_users_last_login ON public.users;
CREATE TRIGGER update_users_last_login
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_last_login_column();

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'lecturer'
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;

-- Comment: Authentication providers (email/password) are enabled by default in Supabase
-- Additional providers like Google, GitHub can be configured in Supabase Dashboard
-- under Authentication > Providers