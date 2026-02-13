-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'moderator');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  role public.user_role DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discussion_id UUID REFERENCES public.discussions ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'beginner',
  topics JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  roadmap_id UUID REFERENCES public.roadmaps ON DELETE CASCADE NOT NULL,
  completed_topics JSONB DEFAULT '[]',
  current_topic TEXT,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, roadmap_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS discussions_user_id_idx ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS discussions_category_idx ON public.discussions(category);
CREATE INDEX IF NOT EXISTS comments_discussion_id_idx ON public.comments(discussion_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS roadmaps_difficulty_idx ON public.roadmaps(difficulty);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_roadmap_id_idx ON public.user_progress(roadmap_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Discussions policies
CREATE POLICY "Discussions are viewable by everyone" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Users can create discussions" ON public.discussions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own discussions" ON public.discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own discussions" ON public.discussions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Roadmaps policies
CREATE POLICY "Roadmaps are viewable by everyone" ON public.roadmaps FOR SELECT USING (true);

-- User progress policies
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create gamification tables
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'bonus', 'penalty'
  source TEXT NOT NULL, -- 'problem_solved', 'discussion_created', 'login_streak', etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'points', 'problems_solved', 'streak_days', etc.
  requirement_value INTEGER NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'points', 'problems_solved', 'streak_days'
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  leaderboard_id UUID REFERENCES public.leaderboards ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(leaderboard_id, user_id)
);

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

-- Create function to calculate level from experience
CREATE OR REPLACE FUNCTION public.calculate_level(experience INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(experience / 100) + 1
  RETURN FLOOR(experience / 100) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to award points
CREATE OR REPLACE FUNCTION public.award_points(
  user_uuid UUID,
  points_amount INTEGER,
  transaction_source TEXT,
  transaction_description TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
  current_experience INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current user points or create if doesn't exist
  INSERT INTO public.user_points (user_id, points, experience)
  VALUES (user_uuid, points_amount, points_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    points = user_points.points + points_amount,
    experience = user_points.experience + points_amount,
    updated_at = now()
  RETURNING user_points.points, user_points.experience INTO current_points, current_experience;
  
  -- Calculate new level
  new_level := public.calculate_level(current_experience);
  
  -- Update level if changed
  UPDATE public.user_points 
  SET level = new_level 
  WHERE user_id = user_uuid AND level != new_level;
  
  -- Record transaction
  INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description, metadata)
  VALUES (user_uuid, points_amount, 'earned', transaction_source, transaction_description, metadata);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Insert some default roadmaps
INSERT INTO public.roadmaps (title, description, difficulty, topics) VALUES
  ('Frontend Development', 'Learn modern frontend development', 'beginner', '["HTML", "CSS", "JavaScript", "React", "TypeScript"]'),
  ('Backend Development', 'Learn backend development fundamentals', 'intermediate', '["Node.js", "Express", "Databases", "APIs", "Authentication"]'),
  ('Data Structures', 'Master fundamental data structures', 'beginner', '["Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs"]'),
  ('Algorithms', 'Learn essential algorithms', 'intermediate', '["Sorting", "Searching", "Dynamic Programming", "Greedy", "Graph Algorithms"]')
ON CONFLICT DO NOTHING;
