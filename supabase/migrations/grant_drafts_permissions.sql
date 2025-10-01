-- Grant permissions for drafts table to anon and authenticated roles
GRANT ALL PRIVILEGES ON drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON drafts TO anon;

-- Ensure RLS policies allow access
-- Note: This assumes RLS policies are already configured properly
-- If not, additional policies may need to be created