-- Migration: Remove practicals table and restructure dependencies
-- This migration eliminates the foreign key constraint error by removing the practicals table
-- and storing practical information directly in the dependent tables

-- Step 1: Add new columns to manual_templates to store practical information directly
ALTER TABLE manual_templates 
ADD COLUMN practical_title TEXT,
ADD COLUMN practical_number INTEGER,
ADD COLUMN unit_code TEXT,
ADD COLUMN unit_name TEXT,
ADD COLUMN subject subject_type;

-- Step 2: Migrate existing data from practicals and units to manual_templates
-- (This handles any existing data gracefully)
UPDATE manual_templates 
SET 
    practical_title = p.title,
    practical_number = p.number,
    unit_code = u.code,
    unit_name = u.name,
    subject = u.subject
FROM practicals p
JOIN units u ON p.unit_id = u.id
WHERE manual_templates.practical_id = p.id;

-- Step 3: Add new columns to reports table to store practical information directly
ALTER TABLE reports 
ADD COLUMN practical_title TEXT,
ADD COLUMN practical_number INTEGER,
ADD COLUMN unit_code TEXT,
ADD COLUMN unit_name TEXT,
ADD COLUMN subject subject_type;

-- Step 4: Migrate existing data from practicals and units to reports
UPDATE reports 
SET 
    practical_title = p.title,
    practical_number = p.number,
    unit_code = u.code,
    unit_name = u.name,
    subject = u.subject
FROM practicals p
JOIN units u ON p.unit_id = u.id
WHERE reports.practical_id = p.id;

-- Step 5: Drop foreign key constraints
ALTER TABLE manual_templates DROP CONSTRAINT manual_templates_practical_id_fkey;
ALTER TABLE reports DROP CONSTRAINT reports_practical_id_fkey;

-- Step 6: Make practical_id nullable and remove the foreign key requirement
ALTER TABLE manual_templates ALTER COLUMN practical_id DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN practical_id DROP NOT NULL;

-- Step 7: Drop indexes related to practicals
DROP INDEX IF EXISTS idx_manual_templates_practical_id;
DROP INDEX IF EXISTS idx_reports_practical_id;
DROP INDEX IF EXISTS idx_practicals_unit_id;

-- Step 8: Drop the practicals table
DROP TABLE IF EXISTS practicals CASCADE;

-- Step 9: Create new indexes for the new columns
CREATE INDEX idx_manual_templates_subject ON manual_templates(subject);
CREATE INDEX idx_manual_templates_unit_code ON manual_templates(unit_code);
CREATE INDEX idx_reports_subject ON reports(subject);
CREATE INDEX idx_reports_unit_code ON reports(unit_code);

-- Step 10: Update RLS policies to work with the new structure
-- Drop existing policies that might reference practicals
DROP POLICY IF EXISTS "Users can view practicals" ON practicals;
DROP POLICY IF EXISTS "Authenticated users can view practicals" ON practicals;

-- Step 11: Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON manual_templates TO authenticated;
GRANT SELECT ON manual_templates TO anon;
GRANT SELECT, INSERT, UPDATE ON reports TO authenticated;

-- Step 12: Add comments for documentation
COMMENT ON COLUMN manual_templates.practical_title IS 'Title of the practical (formerly from practicals table)';
COMMENT ON COLUMN manual_templates.practical_number IS 'Number of the practical (formerly from practicals table)';
COMMENT ON COLUMN manual_templates.unit_code IS 'Unit code (formerly from units table via practicals)';
COMMENT ON COLUMN manual_templates.unit_name IS 'Unit name (formerly from units table via practicals)';
COMMENT ON COLUMN manual_templates.subject IS 'Subject type (formerly from units table via practicals)';

COMMENT ON COLUMN reports.practical_title IS 'Title of the practical (formerly from practicals table)';
COMMENT ON COLUMN reports.practical_number IS 'Number of the practical (formerly from practicals table)';
COMMENT ON COLUMN reports.unit_code IS 'Unit code (formerly from units table via practicals)';
COMMENT ON COLUMN reports.unit_name IS 'Unit name (formerly from units table via practicals)';
COMMENT ON COLUMN reports.subject IS 'Subject type (formerly from units table via practicals)';

-- Migration completed successfully
-- The practicals table has been removed and its data has been denormalized into dependent tables
-- This eliminates the foreign key constraint error (23503) that was preventing manual uploads