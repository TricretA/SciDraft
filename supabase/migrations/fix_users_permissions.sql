-- Fix permissions for users table to resolve "Database error saving new user"

-- Grant necessary permissions to anon role (for signup)
GRANT INSERT ON users TO anon;
GRANT SELECT ON users TO anon;

-- Grant full access to authenticated role
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view and update their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);