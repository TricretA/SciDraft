-- Make user_id nullable in reports table to allow anonymous report generation
-- This allows anonymous users to save full reports using session_id

ALTER TABLE public.reports ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.reports.user_id IS 'User ID - nullable to allow anonymous reports identified by session_id';