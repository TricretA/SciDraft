-- Fix user insert trigger by adding proper RLS policy for automatic user creation

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow user signup" ON users;

-- Create a policy that allows the trigger function to insert new users
-- This policy allows INSERT when the user ID matches the authenticated user ID
-- or when it's being inserted by the system (trigger)
CREATE POLICY "Allow user profile creation" ON users
  FOR INSERT 
  WITH CHECK (
    -- Allow if the user ID matches the current auth user (for trigger)
    auth.uid() = id 
    OR 
    -- Allow if there's no current auth context (for system operations)
    auth.uid() IS NULL
  );

-- Ensure the trigger function has the necessary permissions
GRANT INSERT ON users TO service_role;
GRANT SELECT ON users TO service_role;

-- Also ensure anon role can trigger the signup process
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA public TO anon;