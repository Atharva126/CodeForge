-- Create contest_problems join table
CREATE TABLE IF NOT EXISTS public.contest_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(contest_id, problem_id)
);

-- RLS Policies
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contest problems"
ON public.contest_problems FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Creators can manage contest problems"
ON public.contest_problems FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contests
        WHERE public.contests.id = contest_id
        AND public.contests.creator_id = auth.uid()
    )
);
