-- SUPREME GAMIFICATION & BADGES FIX
-- This script ensures all tables, columns, and RPCs for the badge/point system are correct.

-- 1. Ensure all gamification columns exist in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contests_participated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_contest_rank INTEGER DEFAULT 999999,
ADD COLUMN IF NOT EXISTS perfect_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speed_demon_achievements INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consistency_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS languages_used TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS problems_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS forge_coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- 2. Ensure notifications table exists and uses profiles(id)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;

-- 3. Ensure user_activity table exists and uses profiles(id)
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS title TEXT;

-- 4. Ensure user_badges table is correctly structured (AGGRESSIVE RECREATE)
DROP TABLE IF EXISTS public.user_badges CASCADE;
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Ensure unique constraint exists for ON CONFLICT (for good measure)
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_badge_id_key;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);

-- 5. Ensure user_points table exists and uses profiles(id)
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE;

-- 6. Ensure point_transactions table exists
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'bonus', 'penalty'
    source TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Ensure achievements tables exist
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_reward INTEGER DEFAULT 0,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- 8. RPC: award_points
DROP FUNCTION IF EXISTS award_points(UUID, INTEGER, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION award_points(
    user_uuid UUID,
    points_amount INTEGER,
    transaction_source TEXT,
    transaction_description TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    -- Update user_points
    INSERT INTO public.user_points (user_id, points, experience)
    VALUES (user_uuid, points_amount, points_amount)
    ON CONFLICT (user_id) DO UPDATE SET
        points = user_points.points + EXCLUDED.points,
        experience = user_points.experience + EXCLUDED.points,
        updated_at = now();

    -- Record transaction
    INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description, metadata)
    VALUES (user_uuid, points_amount, 'earned', transaction_source, transaction_description, metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: unlock_user_badge (Bypasses schema cache issues)
CREATE OR REPLACE FUNCTION unlock_user_badge(
    p_user_id UUID,
    p_badge_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- In a real scenario we might log this, but let's keep it simple
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.unlock_user_badge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_user_badge(UUID, TEXT) TO service_role;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- 10. Enable RLS on all
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies (Users can only see their own data)
DO $$ 
BEGIN
    -- Notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can select own notifications') THEN
        CREATE POLICY "Users can select own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert own notifications') THEN
        CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Activity
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity' AND policyname = 'Users can select own activity') THEN
        CREATE POLICY "Users can select own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity' AND policyname = 'Users can insert own activity') THEN
        CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Badges
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'Users can select own badges') THEN
        CREATE POLICY "Users can select own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'Users can insert own badges') THEN
        CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Points
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_points' AND policyname = 'Users can select own points') THEN
        CREATE POLICY "Users can select own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Achievements (Publicly viewable)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Achievements are public') THEN
        CREATE POLICY "Achievements are public" ON public.achievements FOR SELECT USING (true);
    END IF;
    
    -- User Achievements
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can select own achievements') THEN
        CREATE POLICY "Users can select own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 11. Optional: Initial user_points for existing users
INSERT INTO public.user_points (user_id, points, level, experience)
SELECT id, 0, 1, 0 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
