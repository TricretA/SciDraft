-- Migration to fix foreign key constraint error by removing practicals table dependency
-- This addresses the 23503 constraint violation error

-- Step 1: Drop the foreign key constraint from manual_templates
ALTER TABLE manual_templates DROP CONSTRAINT IF EXISTS manual_templates_practical_id_fkey;

-- Step 2: Make practical_id nullable in manual_templates (since it's no longer a foreign key)
ALTER TABLE manual_templates ALTER COLUMN practical_id DROP NOT NULL;

-- Step 3: Drop the foreign key constraint from reports
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_practical_id_fkey;

-- Step 4: Make practical_id nullable in reports
ALTER TABLE reports ALTER COLUMN practical_id DROP NOT NULL;

-- Step 5: Drop the practicals table (after removing all dependencies)
DROP TABLE IF EXISTS practicals CASCADE;

-- Step 6: Update RLS policies to remove references to practicals table
-- Drop existing policies that might reference practicals
DROP POLICY IF EXISTS "Users can view their own manual templates" ON manual_templates;
DROP POLICY IF EXISTS "Users can insert manual templates" ON manual_templates;
DROP POLICY IF EXISTS "Users can update their own manual templates" ON manual_templates;

-- Create new RLS policies for manual_templates without practicals dependency
CREATE POLICY "Users can view manual templates" ON manual_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert manual templates" ON manual_templates
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update manual templates" ON manual_templates
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Update reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON reports;

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert reports" ON reports
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports" ON reports
    FOR UPDATE USING (user_id = auth.uid());

-- Step 7: Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON manual_templates TO authenticated;
GRANT SELECT ON manual_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO authenticated;

-- Add comments
COMMENT ON COLUMN manual_templates.practical_id IS 'UUID field for practical identification (no longer foreign key)';
COMMENT ON COLUMN reports.practical_id IS 'UUID field for practical identification (no longer foreign key)';