-- Fix permissions for reports table to allow anon access
-- This allows the ReportViewer to work without authentication

-- Grant SELECT permission to anon role for reports table
GRANT SELECT ON reports TO anon;

-- Grant SELECT permission to authenticated role as well
GRANT SELECT ON reports TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'reports'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;