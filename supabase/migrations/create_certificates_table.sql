-- Create user_certificates table to track course completions
CREATE TABLE IF NOT EXISTS public.user_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    certificate_id TEXT UNIQUE NOT NULL, -- Human readable ID like CF-PY-2026-XXXX
    
    -- Ensure a user only gets one certificate per course
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own certificates"
    ON public.user_certificates FOR SELECT
    USING (auth.uid() = user_id);

-- Allow public viewing if the profile is public (optional but good for social validation)
CREATE POLICY "Public certificates are visible if profile is public"
    ON public.user_certificates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = user_id AND public_profile = true
        )
    );

-- Allow system/service role to insert (or use a function)
CREATE POLICY "Users can claim their own certificates"
    ON public.user_certificates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id ON public.user_certificates(user_id);
