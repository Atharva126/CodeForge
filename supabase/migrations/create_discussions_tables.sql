-- Drop tables if they exist to ensure fresh schema
DROP TABLE IF EXISTS public.comment_votes CASCADE;
DROP TABLE IF EXISTS public.discussion_votes CASCADE;
DROP TABLE IF EXISTS public.discussion_comments CASCADE;
DROP TABLE IF EXISTS public.discussions CASCADE;

-- Create discussions table
CREATE TABLE public.discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create discussion_comments table
CREATE TABLE public.discussion_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create discussion_votes table
CREATE TABLE public.discussion_votes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, discussion_id)
);

-- Create comment_votes table
CREATE TABLE public.comment_votes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE NOT NULL,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON public.discussions;
DROP POLICY IF EXISTS "Users can create discussions" ON public.discussions;
DROP POLICY IF EXISTS "Users can update their own discussions" ON public.discussions;
DROP POLICY IF EXISTS "Users can delete their own discussions" ON public.discussions;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.discussion_comments;

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.discussion_votes;
DROP POLICY IF EXISTS "Users can vote" ON public.discussion_votes;
DROP POLICY IF EXISTS "Users can update their own vote" ON public.discussion_votes;
DROP POLICY IF EXISTS "Users can delete their own vote" ON public.discussion_votes;

DROP POLICY IF EXISTS "Comment votes are viewable by everyone" ON public.comment_votes;
DROP POLICY IF EXISTS "Users can vote on comments" ON public.comment_votes;
DROP POLICY IF EXISTS "Users can update their own comment vote" ON public.comment_votes;
DROP POLICY IF EXISTS "Users can delete their own comment vote" ON public.comment_votes;

-- Policies for discussions
CREATE POLICY "Discussions are viewable by everyone" 
    ON public.discussions FOR SELECT 
    USING (true);

CREATE POLICY "Users can create discussions" 
    ON public.discussions FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own discussions" 
    ON public.discussions FOR UPDATE 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own discussions" 
    ON public.discussions FOR DELETE 
    USING (auth.uid() = author_id);

-- Policies for discussion_comments
CREATE POLICY "Comments are viewable by everyone" 
    ON public.discussion_comments FOR SELECT 
    USING (true);

CREATE POLICY "Users can create comments" 
    ON public.discussion_comments FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
    ON public.discussion_comments FOR UPDATE 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
    ON public.discussion_comments FOR DELETE 
    USING (auth.uid() = author_id);

-- Policies for votes
CREATE POLICY "Votes are viewable by everyone" 
    ON public.discussion_votes FOR SELECT 
    USING (true);

CREATE POLICY "Users can vote" 
    ON public.discussion_votes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote" 
    ON public.discussion_votes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vote" 
    ON public.discussion_votes FOR DELETE 
    USING (auth.uid() = user_id);

-- Same for comment votes
CREATE POLICY "Comment votes are viewable by everyone" 
    ON public.comment_votes FOR SELECT 
    USING (true);

CREATE POLICY "Users can vote on comments" 
    ON public.comment_votes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment vote" 
    ON public.comment_votes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment vote" 
    ON public.comment_votes FOR DELETE 
    USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_discussions_updated_at ON public.discussions;
CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON public.discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussion_comments_updated_at ON public.discussion_comments;
CREATE TRIGGER update_discussion_comments_updated_at
    BEFORE UPDATE ON public.discussion_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
