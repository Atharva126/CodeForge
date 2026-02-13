-- All-in-one Roadmap Initialization & Striver's DSA Sheet Seeding
-- This script ensures the database structure exists before adding the data.

-- 1. Create Roadmaps Table (if not exists)
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required columns exist in the existing table
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Create Roadmap Nodes Table (if not exists)
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required columns exist
ALTER TABLE public.roadmap_nodes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.roadmap_nodes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.roadmap_nodes ADD COLUMN IF NOT EXISTS order_index INTEGER;
ALTER TABLE public.roadmap_nodes ADD COLUMN IF NOT EXISTS problem_ids TEXT[];
ALTER TABLE public.roadmap_nodes ADD COLUMN IF NOT EXISTS parent_node_id UUID REFERENCES public.roadmap_nodes(id) ON DELETE SET NULL;

-- 3. Create User Roadmap Progress Table
CREATE TABLE IF NOT EXISTS public.user_roadmap_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, node_id)
);

-- 4. Enable RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Safe check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read for roadmaps') THEN
        CREATE POLICY "Public read for roadmaps" ON public.roadmaps FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read for roadmap nodes') THEN
        CREATE POLICY "Public read for roadmap nodes" ON public.roadmap_nodes FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can see their own progress') THEN
        CREATE POLICY "Users can see their own progress" ON public.user_roadmap_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own progress') THEN
        CREATE POLICY "Users can update their own progress" ON public.user_roadmap_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Seed Striver's DSA Sheet Roadmap
INSERT INTO roadmaps (title, description, slug, category, difficulty, estimated_hours, thumbnail_url)
VALUES (
    'Striver''s A-Z DSA Sheet',
    'The ultimate Data Structures and Algorithms sheet by Striver (Raj Vikramaditya). Master every concept from basics to advanced DP and Graphs with over 450+ handpicked problems.',
    'strivers-a-z-dsa-sheet',
    'DSA',
    'Beginner',
    150,
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop'
) ON CONFLICT (slug) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    estimated_hours = EXCLUDED.estimated_hours,
    thumbnail_url = EXCLUDED.thumbnail_url;

-- 7. Seed Nodes
DO $$
DECLARE
    roadmap_id_val UUID;
BEGIN
    SELECT id INTO roadmap_id_val FROM roadmaps WHERE slug = 'strivers-a-z-dsa-sheet';

    -- Delete existing nodes to prevent duplication on re-run
    DELETE FROM roadmap_nodes WHERE roadmap_id = roadmap_id_val;

    -- Basics
    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (
        roadmap_id_val,
        'DSA Basics',
        'Learn the fundamentals of programming and basic math for DSA.',
        0,
        '### Getting Started\nFocus on complexity analysis, basic math tricks, and recursion fundamentals.',
        ARRAY['two-sum', 'reverse-integer', 'palindrome-number']
    );

    -- Arrays
    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (
        roadmap_id_val,
        'Arrays : Easy to Hard',
        'Master array manipulation from simple rotations to complex subarrays.',
        1,
        '### Array Patterns\nArray problems often use two-pointers, sliding window, and Kadene''s algorithm.',
        ARRAY['remove-duplicates-from-sorted-array', 'maximum-subarray', 'rotate-image', '3sum']
    );

    -- Higher nodes... (Condensed for brevity, adding core ones back)
    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (roadmap_id_val, 'Binary Search', 'Master searching in sorted spaces.', 2, '### Binary Search logic', ARRAY['search-insert-position', 'sqrtx', 'median-of-two-sorted-arrays']);
    
    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (roadmap_id_val, 'Linked Lists', 'Master pointers and structures.', 3, '### Pointer Magic', ARRAY['merge-two-sorted-lists', 'reverse-nodes-in-k-group', 'rotate-list']);

    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (roadmap_id_val, 'Binary Trees', 'Master hierarchical structures.', 4, '### Tree Mastery', ARRAY['codeforge-binary-tree-traversal', 'binary-tree-maximum-path-sum']);

    INSERT INTO roadmap_nodes (roadmap_id, title, description, order_index, content, problem_ids)
    VALUES (roadmap_id_val, 'Dynamic Programming', 'Master memoization and optimization.', 5, '### DP Mastery', ARRAY['climbing-stairs', 'unique-paths', 'minimum-path-sum']);

END $$;
