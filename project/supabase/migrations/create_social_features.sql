-- Add social stats to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create user_followers table
CREATE TABLE IF NOT EXISTS public.user_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Followers
CREATE POLICY "Anyone can view follower relationships"
    ON public.user_followers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.user_followers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
    ON public.user_followers FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);

-- Trigger to update follower/following counts
CREATE OR REPLACE FUNCTION update_social_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment counts
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        
        -- Create notification for the user being followed
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            NEW.following_id, 
            'social', 
            'New Follower!', 
            (SELECT username FROM public.profiles WHERE id = NEW.follower_id) || ' started following you.',
            '/profile/' || (SELECT username FROM public.profiles WHERE id = NEW.follower_id)
        );
        
        -- Log activity
        INSERT INTO public.user_activity (user_id, action_type, title, description)
        VALUES (
            NEW.follower_id, 
            'follow', 
            'Started Following', 
            'Started following ' || (SELECT username FROM public.profiles WHERE id = NEW.following_id)
        );
        
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement counts
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_update_stats
AFTER INSERT OR DELETE ON public.user_followers
FOR EACH ROW EXECUTE FUNCTION update_social_counts();
