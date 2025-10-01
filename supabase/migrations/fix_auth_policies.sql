-- Fix authentication and RLS policy issues
-- This migration resolves infinite recursion in admins table policies
-- and ensures proper access control for users table

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Drop any existing policies on admins table that might cause recursion
DROP POLICY IF EXISTS "Admins can view themselves" ON admins;
DROP POLICY IF EXISTS "Admins can update themselves" ON admins;
DROP POLICY IF EXISTS "Enable read access for admins" ON admins;
DROP POLICY IF EXISTS "Enable update access for admins" ON admins;

-- Create simple, non-recursive policies for users table
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IN (
        SELECT auth.uid() FROM auth.users WHERE auth.jwt() ->> 'role' = 'service_role'
    ));

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users on own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create simple policies for admins table (no recursion)
CREATE POLICY "Enable read access for admins" ON admins
    FOR SELECT USING (true); -- Allow all reads for now, can be restricted later

CREATE POLICY "Enable update for admins" ON admins
    FOR UPDATE USING (true); -- Allow all updates for now, can be restricted later

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON admins TO anon;
GRANT SELECT ON admins TO authenticated;

-- Ensure the users table has proper constraints
ALTER TABLE users ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();

-- Add an index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Insert a test user if none exists (for development)
INSERT INTO users (id, email, name, role, active_plan)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test@example.com',
    'Test User',
    'student'::user_role,
    'free'::user_plan
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com')
ON CONFLICT (id) DO NOTHING;

COMMIT;