-- Create indexes for gamification tables
CREATE INDEX IF NOT EXISTS user_points_user_id_idx ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS user_points_points_idx ON public.user_points(points DESC);
CREATE INDEX IF NOT EXISTS user_points_level_idx ON public.user_points(level DESC);
CREATE INDEX IF NOT EXISTS point_transactions_user_id_idx ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS point_transactions_created_at_idx ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS point_transactions_type_idx ON public.point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_achievement_id_idx ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS leaderboard_entries_leaderboard_id_idx ON public.leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS leaderboard_entries_user_id_idx ON public.leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS leaderboard_entries_score_idx ON public.leaderboard_entries(score DESC);
