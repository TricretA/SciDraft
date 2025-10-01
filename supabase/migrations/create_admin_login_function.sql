-- Create function to verify admin login credentials
-- This function safely authenticates admin users against the admins table

CREATE OR REPLACE FUNCTION public.verify_admin_login(
    input_email TEXT,
    input_password TEXT
)
RETURNS TABLE(
    id UUID,
    email TEXT,
    name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return admin data if email exists and password matches
    RETURN QUERY
    SELECT 
        a.id,
        a.email,
        a.name,
        a.role
    FROM public.admins a
    WHERE a.email = input_email
    AND public.verify_admin_password(input_password, a.password_hash) = true;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.verify_admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_login(TEXT, TEXT) TO authenticated;