-- Update contests table to include creator_id and add RLS policies for creation

-- 1. Add creator_id column
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add RLS policy for inserting contests
DROP POLICY IF EXISTS "Authenticated users can create contests" ON public.contests;
CREATE POLICY "Authenticated users can create contests"
ON public.contests FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Add RLS policy for creators to update their contests
DROP POLICY IF EXISTS "Creators can update their own contests" ON public.contests;
CREATE POLICY "Creators can update their own contests"
ON public.contests FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- 4. Add RLS policy for creators to delete their own contests
DROP POLICY IF EXISTS "Creators can delete their own contests" ON public.contests;
CREATE POLICY "Creators can delete their own contests"
ON public.contests FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);
