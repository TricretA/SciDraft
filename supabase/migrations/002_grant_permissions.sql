-- Grant permissions to anon and authenticated roles for all tables

-- Grant SELECT permissions to anon role (for public read access)
GRANT SELECT ON users TO anon;
GRANT SELECT ON units TO anon;
GRANT SELECT ON practicals TO anon;
GRANT SELECT ON manual_templates TO anon;
GRANT SELECT ON manual_versions TO anon;
GRANT SELECT ON reports TO anon;
GRANT SELECT ON report_drawings TO anon;
GRANT SELECT ON exports TO anon;
GRANT SELECT ON payments TO anon;
GRANT SELECT ON feedback TO anon;
GRANT SELECT ON prompts TO anon;
GRANT SELECT ON admin_logs TO anon;
GRANT SELECT ON support_requests TO anon;
GRANT SELECT ON notifications TO anon;

-- Grant full privileges to authenticated role (for logged-in users)
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON units TO authenticated;
GRANT ALL PRIVILEGES ON practicals TO authenticated;
GRANT ALL PRIVILEGES ON manual_templates TO authenticated;
GRANT ALL PRIVILEGES ON manual_versions TO authenticated;
GRANT ALL PRIVILEGES ON reports TO authenticated;
GRANT ALL PRIVILEGES ON report_drawings TO authenticated;
GRANT ALL PRIVILEGES ON exports TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON feedback TO authenticated;
GRANT ALL PRIVILEGES ON prompts TO authenticated;
GRANT ALL PRIVILEGES ON admin_logs TO authenticated;
GRANT ALL PRIVILEGES ON support_requests TO authenticated;
GRANT ALL PRIVILEGES ON notifications TO authenticated;

-- Grant usage on sequences to authenticated role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant usage on sequences to anon role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;