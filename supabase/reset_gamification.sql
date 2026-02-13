-- Clean reset for gamification system
-- Run this first if you're getting errors

-- Drop everything in correct order
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.initialize_user_points();
DROP FUNCTION IF EXISTS public.award_points(UUID, INTEGER, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.calculate_level(INTEGER);

DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.leaderboards CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.point_transactions CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
