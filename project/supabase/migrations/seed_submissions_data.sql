-- Seed user_submissions with realistic data for the heatmap
WITH expanded_dates AS (
    -- Generate a series of dates for the last year
    SELECT 
        date_trunc('day', dd)::date as submit_date
    FROM generate_series
        (now() - interval '1 year', now(), '1 day'::interval) dd
),
random_submissions AS (
    -- Cross join with a generator to create multiple submissions per day (0 to 5)
    SELECT 
        submit_date,
        (random() * 5)::int as submission_count
    FROM expanded_dates
),
user_profile AS (
    SELECT id FROM public.profiles LIMIT 1
),
problems_list AS (
    SELECT id FROM public.problems
)
INSERT INTO public.user_submissions (user_id, problem_id, status, language, code, runtime, memory, submitted_at)
SELECT 
    (SELECT id FROM user_profile),
    (SELECT id FROM problems_list ORDER BY random() LIMIT 1),
    CASE 
        WHEN random() < 0.6 THEN 'Accepted' 
        WHEN random() < 0.8 THEN 'Wrong Answer'
        ELSE 'Time Limit Exceeded'
    END,
    CASE 
        WHEN random() < 0.5 THEN 'javascript'
        WHEN random() < 0.8 THEN 'python'
        ELSE 'cpp'
    END,
    '// Mock code submission',
    (random() * 100)::float,
    (random() * 50)::float,
    -- Add random time to the date
    submit_date + (random() * interval '24 hours')
FROM random_submissions, generate_series(1, submission_count + 1)
WHERE submission_count > 0;
