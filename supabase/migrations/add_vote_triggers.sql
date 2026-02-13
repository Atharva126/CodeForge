-- Function to update discussion upvotes/downvotes
CREATE OR REPLACE FUNCTION public.handle_discussion_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 1 THEN
      UPDATE public.discussions SET upvotes = upvotes + 1 WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.discussions SET downvotes = downvotes + 1 WHERE id = NEW.discussion_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 1 THEN
      UPDATE public.discussions SET upvotes = upvotes - 1 WHERE id = OLD.discussion_id;
    ELSE
      UPDATE public.discussions SET downvotes = downvotes - 1 WHERE id = OLD.discussion_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If changing from Up(1) to Down(-1)
    IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
      UPDATE public.discussions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.discussion_id;
    -- If changing from Down(-1) to Up(1)
    ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
      UPDATE public.discussions SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = NEW.discussion_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for discussion_votes
DROP TRIGGER IF EXISTS on_discussion_vote_change ON public.discussion_votes;
CREATE TRIGGER on_discussion_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_discussion_vote();

-- Function to update comment upvotes/downvotes
CREATE OR REPLACE FUNCTION public.handle_comment_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 1 THEN
      UPDATE public.discussion_comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.discussion_comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 1 THEN
      UPDATE public.discussion_comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.discussion_comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
      UPDATE public.discussion_comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
      UPDATE public.discussion_comments SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment_votes
DROP TRIGGER IF EXISTS on_comment_vote_change ON public.comment_votes;
CREATE TRIGGER on_comment_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_vote();
