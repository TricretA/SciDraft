-- Fix user signup by allowing INSERT for new user registration
-- This policy allows users to create their own profile during signup

CREATE POLICY "Allow user signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions for anon and authenticated roles
GRANT INSERT ON users TO anon;
GRANT INSERT ON users TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;