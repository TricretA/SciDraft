-- Create function to hash passwords using PostgreSQL crypt() with proper salt generation
-- This function generates a bcrypt hash with cost factor 12

CREATE OR REPLACE FUNCTION public.hash_admin_password(
    input_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate bcrypt hash with cost factor 12
    -- gen_salt('bf', 12) generates a proper bcrypt salt
    RETURN crypt(input_password, gen_salt('bf', 12));
EXCEPTION
    WHEN OTHERS THEN
        -- Return null on error to indicate failure
        RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.hash_admin_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hash_admin_password(TEXT) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.hash_admin_password(TEXT) IS 'Securely hashes admin passwords using PostgreSQL crypt() with bcrypt and proper salt generation';