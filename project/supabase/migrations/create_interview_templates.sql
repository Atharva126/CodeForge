-- Create interview templates table
CREATE TABLE IF NOT EXISTS public.interview_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    duration TEXT NOT NULL,
    questions_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.interview_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
ON public.interview_templates FOR SELECT
TO authenticated
USING (true);

-- Seed templates
INSERT INTO public.interview_templates (title, description, category, difficulty, duration, questions_count)
VALUES 
('Google Frontend Engineer', 'Master the DOM, modern React patterns, and complex state management in this high-intensity frontend mock.', 'Technical', 'Hard', '60m', 5),
('Amazon SDE-1 Backend', 'Focused on data structures, algorithms, and microservices architecture fundamentals.', 'Technical', 'Medium', '45m', 4),
('System Design - Scalability', 'Design a global notification system capable of handling millions of requests per second.', 'System Design', 'Hard', '60m', 2),
('Behavioral Mastery', 'Practice the STAR method for leadership and conflict resolution questions.', 'Behavioral', 'Easy', '30m', 6),
('Fullstack Bootcamp Prep', 'Perfect for juniors focusing on basic API design and frontend integration.', 'Technical', 'Easy', '45m', 3),
('DBA & SQL Optimization', 'Complex queries, indexing strategies, and database normalization techniques.', 'Database', 'Medium', '45m', 5);
