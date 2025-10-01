-- Create drafts table for storing AI-generated draft reports
CREATE TABLE IF NOT EXISTS public.drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    draft TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drafts_session_id ON public.drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);

-- Enable RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own drafts
CREATE POLICY "Users can view their own drafts" ON public.drafts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own drafts
CREATE POLICY "Users can insert their own drafts" ON public.drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update their own drafts" ON public.drafts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts" ON public.drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON public.drafts TO authenticated;
GRANT SELECT ON public.drafts TO anon;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON public.drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();