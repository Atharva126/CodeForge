-- Create trigger to initialize user points when profile is created
CREATE OR REPLACE FUNCTION public.initialize_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points (user_id, points, experience, level)
  VALUES (NEW.id, 0, 0, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user points initialization
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_points();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points_reward, requirement_type, requirement_value, is_hidden) VALUES
  ('First Steps', 'Earned your first points', '🎯', 10, 'points', 1, false),
  ('Problem Solver', 'Solved 10 problems', '🔥', 50, 'problems_solved', 10, false),
  ('Expert Coder', 'Solved 50 problems', '💎', 100, 'problems_solved', 50, false),
  ('Master Developer', 'Solved 100 problems', '👑', 200, 'problems_solved', 100, false),
  ('Discussion Starter', 'Created your first discussion', '💬', 15, 'discussions_created', 1, false),
  ('Active Contributor', 'Made 10 comments', '🗣️', 30, 'comments_made', 10, false),
  ('Streak Master', '7-day login streak', '🔥', 35, 'streak_days', 7, false),
  ('Level Up!', 'Reached level 5', '⬆️', 25, 'level', 5, false),
  ('Point Collector', 'Earned 500 points', '💰', 50, 'points', 500, false),
  ('Elite Coder', 'Reached level 10', '🏆', 100, 'level', 10, false)
ON CONFLICT DO NOTHING;

-- Insert default leaderboards
INSERT INTO public.leaderboards (name, description, type, period) VALUES
  ('Daily Points', 'Most points earned today', 'points', 'daily'),
  ('Weekly Points', 'Most points earned this week', 'points', 'weekly'),
  ('Monthly Points', 'Most points earned this month', 'points', 'monthly'),
  ('All-Time Points', 'Total points leaderboard', 'points', 'all_time'),
  ('Daily Streak', 'Longest daily streak', 'streak_days', 'daily'),
  ('Problem Solvers', 'Most problems solved', 'problems_solved', 'all_time')
ON CONFLICT DO NOTHING;
