-- Create user_course_progress table to track lesson completions
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL, -- Lesson identifier from the curriculum
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own progress"
    ON public.user_course_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON public.user_course_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
    ON public.user_course_progress FOR DELETE
    USING (auth.uid() = user_id);

-- Migration complete
