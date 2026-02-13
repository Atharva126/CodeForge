-- Seed data for discussions
INSERT INTO public.discussions (title, content, author_id, category, tags, upvotes, downvotes, views, created_at)
VALUES
    (
        'Best resources to learn Dynamic Programming?',
        'I am struggling with DP problems. Can anyone suggest good resources or a roadmap to master Dynamic Programming? I have tried a few YouTube channels but still find it hard to identify overlapping subproblems.',
        (SELECT id FROM public.profiles LIMIT 1),
        'DSA',
        ARRAY['dp', 'algorithms', 'help'],
        15,
        0,
        120,
        NOW() - INTERVAL '2 days'
    ),
    (
        'How to handle authentication in Next.js 14?',
        'I see there are many ways to do auth in Next.js (NextAuth, Supabase, Clerk). Which one do you recommend for a beginner building a SaaS MVP? I am looking for something easy to implement but scalable.',
        (SELECT id FROM public.profiles LIMIT 1),
        'Web Dev',
        ARRAY['nextjs', 'react', 'auth'],
        8,
        1,
        45,
        NOW() - INTERVAL '5 hours'
    ),
    (
        'LeetCode biweekly contest analysis',
        'Did anyone else find Q3 in the last contest particularly tricky? I solved it using a Greed approach but got TLE on test case 45. Here is my approach...',
        (SELECT id FROM public.profiles LIMIT 1),
        'Contests',
        ARRAY['leetcode', 'contest', 'greedy'],
        22,
        2,
        300,
        NOW() - INTERVAL '1 day'
    );

-- Seed data for comments (assuming the first discussion we just inserted)
-- We use a CTE to get the discussion ID dynamically
WITH first_discussion AS (
    SELECT id FROM public.discussions WHERE title = 'Best resources to learn Dynamic Programming?' LIMIT 1
)
INSERT INTO public.discussion_comments (discussion_id, author_id, content, upvotes, created_at)
SELECT
    id,
    (SELECT id FROM public.profiles LIMIT 1),
    'I highly recommend "Dynamic Programming for Interviews" by Sam Gualtieri. It breaks down patterns really well.',
    5,
    NOW() - INTERVAL '1 day'
FROM first_discussion;
