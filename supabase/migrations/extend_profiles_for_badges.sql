-- Add missing gamification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contests_participated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_contest_rank INTEGER DEFAULT 999999,
ADD COLUMN IF NOT EXISTS perfect_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speed_demon_achievements INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consistency_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS languages_used TEXT[] DEFAULT '{}';

-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_badges
CREATE POLICY "Users can view their own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
    ON public.user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);
