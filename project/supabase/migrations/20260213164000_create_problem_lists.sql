-- Create user_problem_lists table
CREATE TABLE IF NOT EXISTS public.user_problem_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_problem_list_items table
CREATE TABLE IF NOT EXISTS public.user_problem_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.user_problem_lists(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL, -- problem_id in problems table is a string (e.g., '1', '2')
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(list_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.user_problem_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_problem_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Lists
CREATE POLICY "Users can view their own lists"
    ON public.user_problem_lists FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
    ON public.user_problem_lists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
    ON public.user_problem_lists FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
    ON public.user_problem_lists FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for List Items
CREATE POLICY "Users can view items in their own lists"
    ON public.user_problem_list_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_problem_lists
            WHERE id = list_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add items to their own lists"
    ON public.user_problem_list_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_problem_lists
            WHERE id = list_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove items from their own lists"
    ON public.user_problem_list_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_problem_lists
            WHERE id = list_id AND user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_problem_lists_updated_at
BEFORE UPDATE ON public.user_problem_lists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
