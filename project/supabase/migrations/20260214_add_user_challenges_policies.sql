-- Add missing RLS policies for user_challenges table
-- The original schema only had SELECT policy, but we need UPDATE for progress tracking

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own challenge progress" ON public.user_challenges;

-- Create UPDATE policy to allow users to update their own challenges
CREATE POLICY "Users can update their own challenge progress" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also add INSERT policy in case sync_user_challenges needs it
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.user_challenges;
CREATE POLICY "Users can insert their own challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
