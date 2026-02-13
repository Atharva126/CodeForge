-- Enable RLS for gamification tables
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for gamification tables
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaderboards are viewable by everyone" ON public.leaderboards FOR SELECT USING (true);
CREATE POLICY "Leaderboard entries are viewable by everyone" ON public.leaderboard_entries FOR SELECT USING (true);
