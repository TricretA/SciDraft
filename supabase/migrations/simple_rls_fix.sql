-- Simple RLS fix: Just allow trigger to insert and users to access their own data

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create minimal policies
CREATE POLICY "trigger_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "user_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Grant basic permissions
GRANT INSERT, SELECT, UPDATE ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;