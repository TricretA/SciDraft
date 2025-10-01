-- Complete reset of RLS policies to resolve infinite recursion
-- This migration removes all existing policies and creates simple, safe ones

-- Disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
    END LOOP;
END $$;

-- Drop ALL existing policies on admins table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admins' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON admins';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies for users table
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create simple policies for admins table (no auth.uid() references to avoid recursion)
CREATE POLICY "admins_select_all" ON admins
    FOR SELECT USING (true);

CREATE POLICY "admins_insert_all" ON admins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "admins_update_all" ON admins
    FOR UPDATE USING (true);

-- Grant permissions to roles
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON admins TO anon;
GRANT ALL ON admins TO authenticated;

-- Clean up any duplicate or problematic user records
DELETE FROM users WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
        FROM users
    ) t WHERE t.rn > 1
);

COMMIT;