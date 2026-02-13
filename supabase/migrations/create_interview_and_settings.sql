-- 1. Create Interview Sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    duration TEXT NOT NULL,
    questions_count INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    score INTEGER,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add full Settings support to Profiles
-- Using a JSONB column 'settings' to avoid frequent schema changes for preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "auto_save": true,
    "word_wrap": false,
    "timezone": "UTC",
    "language": "javascript",
    "email_digest": "weekly",
    "live_preview": false,
    "auto_complete": true,
    "push_notifications": true,
    "show_line_numbers": true,
    "email_notifications": true
}'::jsonb;

-- RLS Policies
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own interview sessions"
ON public.interview_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions"
ON public.interview_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Seeding some mock sessions for the current user (if any)
-- This is optional but helps visualize the integration
