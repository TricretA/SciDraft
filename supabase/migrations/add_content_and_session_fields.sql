-- Add content and session_id fields to reports table for full report generation
-- This allows storing the full generated report content and session-based access

-- Add content field to store the full report content (JSON format)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content TEXT;

-- Add session_id field for anonymous access
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS session_id UUID;

-- Add metadata field for additional report information
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add subject field to store the subject of the report
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON public.reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_content ON public.reports(content) WHERE content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_subject ON public.reports(subject);

-- Add comments for documentation
COMMENT ON COLUMN public.reports.content IS 'Full report content in JSON format';
COMMENT ON COLUMN public.reports.session_id IS 'Session ID for anonymous access to reports';
COMMENT ON COLUMN public.reports.metadata IS 'Additional metadata for the report (generation info, source, etc.)';
COMMENT ON COLUMN public.reports.subject IS 'Subject of the report (Biology, Chemistry, Physics, etc.)';

-- Grant permissions for new fields
GRANT SELECT, INSERT, UPDATE ON public.reports TO anon, authenticated;