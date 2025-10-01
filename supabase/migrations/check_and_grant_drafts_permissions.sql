-- Check current permissions for drafts table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'drafts' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant SELECT permission to anon role for reading drafts
GRANT SELECT ON drafts TO anon;

-- Grant full access to authenticated role
GRANT ALL PRIVILEGES ON drafts TO authenticated;

-- Verify permissions after granting
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'drafts' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;