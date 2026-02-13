-- Create Contests related tables
-- 1. Contests Table
CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'ended')),
    max_participants INTEGER DEFAULT 100,
    type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'invite_only')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Contest Participants
CREATE TABLE IF NOT EXISTS public.contest_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, contest_id)
);

-- 3. Battles Table
CREATE TABLE IF NOT EXISTS public.battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
    problem_count INTEGER NOT NULL DEFAULT 3,
    duration INTEGER NOT NULL DEFAULT 30, -- in minutes
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Contests: Public read
CREATE POLICY "Public read for contests"
ON public.contests FOR SELECT
TO authenticated, anon
USING (true);

-- Contest Participants: User can see all, but only insert their own
CREATE POLICY "Anyone can see participants"
ON public.contest_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join contests"
ON public.contest_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Battles: Public read for active/completed, private for waiting?
-- Actually, lets allow all authenticated users to see battles for the "Active Battles" list
CREATE POLICY "Public read for battles"
ON public.battles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create battles"
ON public.battles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Participants can update battles"
ON public.battles FOR UPDATE
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_battles_updated_at BEFORE UPDATE ON public.battles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
