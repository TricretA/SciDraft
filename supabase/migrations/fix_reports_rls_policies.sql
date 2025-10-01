-- Fix RLS policies for reports table to allow anonymous access

-- First, ensure the anon role has SELECT permissions on the reports table
GRANT SELECT ON reports TO anon;
GRANT SELECT ON reports TO authenticated;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON reports;
DROP POLICY IF EXISTS "Allow authenticated read access" ON reports;

-- Create RLS policy to allow anonymous users to read all reports
CREATE POLICY "Allow anonymous read access" ON reports
  FOR SELECT
  TO anon
  USING (true);

-- Create RLS policy to allow authenticated users to read all reports
CREATE POLICY "Allow authenticated read access" ON reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify permissions are granted
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'reports' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;