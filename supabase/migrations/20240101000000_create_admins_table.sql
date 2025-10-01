-- Create admins table for SciDraft admin authentication
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Wazimu', 'Vanessa', 'Shem')),
    phone_number TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins table
-- Only authenticated admins can read their own data
CREATE POLICY "Admins can view own data" ON public.admins
    FOR SELECT USING (auth.uid()::text = id::text);

-- Only authenticated admins can update their own data
CREATE POLICY "Admins can update own data" ON public.admins
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow insert for signup (will be controlled by application logic)
CREATE POLICY "Allow admin signup" ON public.admins
    FOR INSERT WITH CHECK (true);

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.admins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admins TO anon;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- Insert the 3 predefined admin accounts (without passwords - will be set during signup)
INSERT INTO public.admins (name, email, role, phone_number, password_hash) VALUES
    ('Wazimu', 'wazimu@scidraft.com', 'Wazimu', '', 'placeholder_hash'),
    ('Vanessa', 'vanessa@scidraft.com', 'Vanessa', '', 'placeholder_hash'),
    ('Shem', 'shem@scidraft.com', 'Shem', '', 'placeholder_hash')
ON CONFLICT (email) DO NOTHING;