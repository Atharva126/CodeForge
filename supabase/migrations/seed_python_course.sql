-- DANGER: This script will WIPE and RE-SEED the Python Course to ensure a clean state
-- This solves the issue of duplicate items or old metadata persisting.

DO $$
DECLARE
    course_item_id UUID;
BEGIN
    -- 1. Find the target course ID by name
    SELECT id INTO course_item_id FROM public.store_items WHERE name = '100 Days of Python Mastery' LIMIT 1;
    
    -- 2. Delete existing order items and the course itself to ensure no conflicts
    -- We use EXECUTE to avoid parse errors if the tables don't exist yet
    IF course_item_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_order_items') THEN
            EXECUTE 'DELETE FROM public.user_order_items WHERE item_id = $1' USING course_item_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_course_progress') THEN
            EXECUTE 'DELETE FROM public.user_course_progress WHERE course_id = $1' USING course_item_id;
        END IF;
        
        DELETE FROM public.store_items WHERE id = course_item_id;
    END IF;
    
    -- 3. Insert fresh course with HIGHLY VERIFIED embeddable IDs
    INSERT INTO public.store_items (
        name, 
        category, 
        price, 
        currency, 
        description, 
        image, 
        duration, 
        level, 
        instructor, 
        rating, 
        students, 
        metadata
    )
    VALUES (
        '100 Days of Python Mastery',
        'course',
        0,
        '₹',
        'Master Python from scratch with CodeWithHarry. The complete 100 Days of Code challenge, optimized for CodeForge.',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop',
        '100 Days',
        'Beginner',
        'CodeWithHarry',
        4.9,
        150000,
        '{
            "curriculum": [
                {
                    "id": "m1",
                    "title": "Module 1: Getting Started",
                    "lessons": [
                        { "id": "p1", "title": "Day 1: Intro to Programming & Python", "duration": "12:00", "video_url": "https://www.youtube.com/embed/gfDE2a7MKjA" },
                        { "id": "p2", "title": "Day 2: Python Setup and Modules", "duration": "15:00", "video_url": "https://www.youtube.com/embed/kYvcc5N_n3Q" },
                        { "id": "p3", "title": "Day 3: Modules and Pip", "duration": "10:00", "video_url": "https://www.youtube.com/embed/IH_l-e07IqY" }
                    ]
                },
                {
                    "id": "m2",
                    "title": "Module 2: Basic Syntax",
                    "lessons": [
                        { "id": "p4", "title": "Day 4: Our First Python Program", "duration": "14:00", "video_url": "https://www.youtube.com/embed/ihk_Xglr164" },
                        { "id": "p5", "title": "Day 5: Comments & Print Statement", "duration": "11:00", "video_url": "https://www.youtube.com/embed/T26M8Y_XWSw" }
                    ]
                }
            ]
        }'::jsonb
    );
END $$;
