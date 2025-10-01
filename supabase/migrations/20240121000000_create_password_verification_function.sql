-- Create function to verify admin passwords using PostgreSQL crypt()
-- This function safely compares input passwords with stored bcrypt hashes

CREATE OR REPLACE FUNCTION public.verify_admin_password(
    input_password TEXT,
    stored_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use crypt() function to compare the input password with the stored hash
    -- crypt(password, hash) will return the same hash if password matches
    RETURN stored_hash = crypt(input_password, stored_hash);
EXCEPTION
    WHEN OTHERS THEN
        -- Return false on any error to prevent information leakage
        RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.verify_admin_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(TEXT, TEXT) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.verify_admin_password(TEXT, TEXT) IS 'Securely verifies admin passwords using PostgreSQL crypt() function';