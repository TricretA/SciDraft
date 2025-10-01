-- Fix RLS policies for manual_templates table
-- Allow authenticated users to insert and select their own manual templates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own manual templates" ON manual_templates;
DROP POLICY IF EXISTS "Users can view their own manual templates" ON manual_templates;
DROP POLICY IF EXISTS "Admins can view all manual templates" ON manual_templates;
DROP POLICY IF EXISTS "Admins can update manual templates" ON manual_templates;

-- Create policies for manual_templates table
CREATE POLICY "Users can insert their own manual templates" ON manual_templates
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own manual templates" ON manual_templates
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can view all manual templates" ON manual_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'lecturer')
        )
    );

CREATE POLICY "Admins can update manual templates" ON manual_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'lecturer')
        )
    );

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT ON manual_templates TO authenticated;
GRANT SELECT ON manual_templates TO anon;

-- Also grant permissions on related tables that might be needed
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON practicals TO authenticated;
GRANT SELECT ON units TO authenticated;