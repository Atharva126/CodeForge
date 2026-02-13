-- Create Roadmaps related tables
-- 1. Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    duration TEXT, -- e.g. "12 weeks", "40 hours"
    category TEXT, -- e.g. "Frontend", "DSA", "Backend"
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Roadmap Nodes
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT, -- Markdown content for the details view
    order_index INTEGER NOT NULL,
    parent_node_id UUID REFERENCES public.roadmap_nodes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Roadmap Progress
CREATE TABLE IF NOT EXISTS public.user_roadmap_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, node_id)
);

-- RLS Policies
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;

-- Roadmaps & Nodes: Public read
CREATE POLICY "Public read for roadmaps" ON public.roadmaps FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public read for roadmap nodes" ON public.roadmap_nodes FOR SELECT TO authenticated, anon USING (true);

-- User Progress: Private read/write
CREATE POLICY "Users can see their own progress"
ON public.user_roadmap_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_roadmap_progress FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Seeding some initial Roadmaps
INSERT INTO public.roadmaps (id, title, slug, description, image, difficulty, duration, category)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Complete Web Development', 'full-stack-web', 'Master the MERN stack from zero to hero.', '/web-dev-roadmap.svg', 'Beginner', '12 weeks', 'Frontend'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Data Structures & Algorithms', 'dsa-mastery', 'Everything you need for top-tier company interviews.', '/dsa-roadmap.svg', 'Intermediate', '8 weeks', 'DSA'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'AI & Machine Learning', 'ai-ml-path', 'Explore the future of tech through deep learning.', '/ai-roadmap.svg', 'Advanced', '15 weeks', 'AI')
ON CONFLICT (slug) DO NOTHING;

-- Seeding some Nodes for Web Dev
INSERT INTO public.roadmap_nodes (roadmap_id, title, content, order_index)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'HTML & CSS Fundamentals', '# HTML & CSS Fundamentals\nLearn semantic HTML and modern CSS layouts like Flexbox and Grid.', 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'JavaScript Basics', '# JavaScript Basics\nVariables, functions, objects, and arrays in modern JS.', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'React.js Mastery', '# React.js Mastery\nHooks, State Management, and Routing basics.', 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Node.js & Express', '# Backend Basics\nBuilding APIs with Node and Express.', 3);

-- Seeding some Nodes for DSA
INSERT INTO public.roadmap_nodes (roadmap_id, title, content, order_index)
VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Big O Notation', '# Analysis of Algorithms\nUnderstand time and space complexity.', 0),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Arrays & Strings', '# Basic Structures\nMaster manipulations and common patterns.', 1),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Numpy & Pandas', '# Data Handling\nFoundations of data science in Python.', 0);

-- Triggers for updated_at
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON public.roadmaps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_roadmap_nodes_updated_at BEFORE UPDATE ON public.roadmap_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
