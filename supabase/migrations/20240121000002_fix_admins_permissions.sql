-- Fix permissions and RLS policies for admins table
-- This migration ensures proper access to the admins table for authentication

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'admins' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant necessary permissions to anon role for login functionality
GRANT SELECT ON "public"."admins" TO anon;
GRANT SELECT ON "public"."admins" TO authenticated;

-- Check if there are any RLS policies blocking access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'admins';

-- If RLS is enabled but no policies exist, create a basic policy to allow read access
-- This is needed for admin authentication to work
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon read access for authentication" ON "public"."admins";
DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."admins";

-- Create new policies
CREATE POLICY "Allow anon read access for authentication" 
ON "public"."admins" 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Allow authenticated read access" 
ON "public"."admins" 
FOR SELECT 
TO authenticated 
USING (true);

-- Verify the data exists
SELECT id, name, email, role, created_at 
FROM "public"."admins" 
ORDER BY created_at;

-- Add comment
COMMENT ON POLICY "Allow anon read access for authentication" ON "public"."admins" 
IS 'Allows anonymous users to read admin records for authentication purposes';

COMMENT ON POLICY "Allow authenticated read access" ON "public"."admins" 
IS 'Allows authenticated users to read admin records';