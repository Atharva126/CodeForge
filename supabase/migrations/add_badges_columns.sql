-- Add is_official and is_pro columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- Create index for faster filtering of official/pro accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_official ON public.profiles(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles(is_pro) WHERE is_pro = true;

-- Update a few accounts for demonstration (optional, can be done by user)
-- UPDATE profiles SET is_official = true WHERE email = 'admin@codeforge.com';
