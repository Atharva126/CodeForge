-- CHALLENGES AND COIN REWARDS SCHEMA
-- This script adds the infrastructure for recurring challenges and daily coin rewards.

-- 1. Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('daily', 'weekly', 'monthly')),
    target_type TEXT NOT NULL, -- 'problems_solved', 'submissions', 'streak', etc.
    target_value INTEGER NOT NULL,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create user_challenges table to track progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT now(),
    -- Reset logic for recurring challenges
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    UNIQUE(user_id, challenge_id, period_start)
);

-- 3. Function to handle daily coin rewards (Login and first submission)
CREATE OR REPLACE FUNCTION handle_daily_reward(
    p_user_id UUID,
    p_reward_type TEXT -- 'login' or 'submission'
) RETURNS INTEGER AS $$
DECLARE
    v_coins INTEGER := 0;
    v_today DATE := CURRENT_DATE;
    v_rewarded BOOLEAN := false;
BEGIN
    -- Determine reward amount
    IF p_reward_type = 'login' THEN
        v_coins := 1;
    ELSIF p_reward_type = 'submission' THEN
        v_coins := 3;
    ELSE
        RETURN 0;
    END IF;

    -- Check if already rewarded today for this type
    SELECT EXISTS (
        SELECT 1 FROM public.user_activity 
        WHERE user_id = p_user_id 
        AND action_type = 'daily_reward_' || p_reward_type
        AND created_at::DATE = v_today
    ) INTO v_rewarded;

    IF v_rewarded THEN
        RETURN 0; -- Already rewarded
    END IF;

    -- Award coins in profiles
    UPDATE public.profiles 
    SET forge_coins = forge_coins + v_coins
    WHERE id = p_user_id;

    -- Log activity to prevent double-claiming and for transparency
    INSERT INTO public.user_activity (user_id, action_type, title, description, metadata)
    VALUES (
        p_user_id, 
        'daily_reward_' || p_reward_type, 
        'Daily ' || INITCAP(p_reward_type) || ' Reward', 
        'Earned ' || v_coins || ' Forge Coins for daily ' || p_reward_type,
        jsonb_build_object('coins', v_coins, 'date', v_today)
    );

    -- Log transaction
    INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description)
    VALUES (p_user_id, v_coins, 'earned', 'daily_' || p_reward_type, 'Daily ' || p_reward_type || ' coin reward');

    RETURN v_coins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Seed some initial challenges
INSERT INTO public.challenges (title, description, category, target_type, target_value, coin_reward, xp_reward)
VALUES 
('Daily Explorer', 'Solve 1 problem today', 'daily', 'problems_solved', 1, 5, 20),
('Code Sprint', 'Make 5 submissions today', 'daily', 'submissions', 5, 10, 50),
('Weekly Warrior', 'Solve 10 problems this week', 'weekly', 'problems_solved', 10, 50, 200),
('Bug Hunter', 'Submit 20 separate solutions this week', 'weekly', 'submissions', 20, 40, 150),
('Monthly Master', 'Solve 50 problems this month', 'monthly', 'problems_solved', 50, 250, 1000),
('Consistency King', 'Maintain a 7-day streak', 'weekly', 'streak', 7, 30, 150),
('Marathon Man', 'Solve 150 problems this month', 'monthly', 'problems_solved', 150, 600, 2500)
ON CONFLICT DO NOTHING;

-- 5. RPC to sync/initialize user challenges for the current period
CREATE OR REPLACE FUNCTION sync_user_challenges(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_challenge RECORD;
    v_start TIMESTAMPTZ;
    v_end TIMESTAMPTZ;
    v_now TIMESTAMPTZ := now();
BEGIN
    FOR v_challenge IN SELECT * FROM public.challenges WHERE is_active = true LOOP
        -- Calculate period based on category
        IF v_challenge.category = 'daily' THEN
            v_start := date_trunc('day', v_now);
            v_end := v_start + interval '1 day';
        ELSIF v_challenge.category = 'weekly' THEN
            v_start := date_trunc('week', v_now);
            v_end := v_start + interval '7 days';
        ELSIF v_challenge.category = 'monthly' THEN
            v_start := date_trunc('month', v_now);
            v_end := v_start + interval '1 month';
        END IF;

        -- Insert if doesn't exist for this period
        INSERT INTO public.user_challenges (user_id, challenge_id, period_start, period_end)
        VALUES (p_user_id, v_challenge.id, v_start, v_end)
        ON CONFLICT (user_id, challenge_id, period_start) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);

GRANT EXECUTE ON FUNCTION public.handle_daily_reward(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_challenges(UUID) TO authenticated;
