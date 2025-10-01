-- Make user_id nullable in drafts table to allow anonymous draft generation
ALTER TABLE public.drafts ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can only see their own drafts" ON public.drafts;

-- Create new policy that allows access based on session_id for anonymous users
CREATE POLICY "Allow access to drafts by session_id" ON public.drafts
  FOR ALL USING (
    -- Allow if user owns the draft (authenticated users)
    (auth.uid() = user_id) OR 
    -- Allow anonymous access (when user_id is null)
    (user_id IS NULL)
  );

-- Grant permissions for anonymous users
GRANT SELECT, INSERT, UPDATE ON public.drafts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.drafts TO authenticated;