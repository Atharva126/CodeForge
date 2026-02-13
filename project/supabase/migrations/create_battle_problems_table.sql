-- Create battle_problems join table
CREATE TABLE IF NOT EXISTS public.battle_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(battle_id, problem_id)
);

-- RLS Policies
ALTER TABLE public.battle_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view battle problems"
ON public.battle_problems FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.battles b
        WHERE b.id = public.battle_problems.battle_id
        AND (b.player1_id = auth.uid() OR b.player2_id = auth.uid())
    )
);

-- Allow creators to link problems to their battles
CREATE POLICY "Creators can insert battle problems" 
ON public.battle_problems FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.battles b
        WHERE b.id = battle_id
        AND b.player1_id = auth.uid()
    )
);

