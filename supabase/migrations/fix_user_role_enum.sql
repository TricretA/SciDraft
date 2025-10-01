-- Fix user_role enum issue
-- The error occurs because there's a 'super_admin' role in the database
-- but the enum only allows 'student', 'lecturer', 'admin'

-- First, let's see what roles exist in the users table
SELECT DISTINCT role FROM users;

-- Add 'super_admin' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Alternatively, if we want to change existing super_admin users to admin:
-- UPDATE users SET role = 'admin' WHERE role = 'super_admin';

-- Grant permissions to ensure anon and authenticated roles can access reports
GRANT SELECT ON reports TO anon;
GRANT ALL PRIVILEGES ON reports TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'reports'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;