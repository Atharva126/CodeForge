-- Function to recalculate user stats (problems solved, acceptance rate)
CREATE OR REPLACE FUNCTION public.recalc_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total INT;
  v_accepted INT;
  v_problems_solved INT;
  v_rate INT;
BEGIN
  v_user_id := NEW.user_id;
  
  -- Calculate total submissions and accepted submissions for the user
  SELECT count(*), count(*) FILTER (WHERE status = 'Accepted')
  INTO v_total, v_accepted
  FROM public.user_submissions
  WHERE user_id = v_user_id;
  
  -- Calculate distinct problems solved
  SELECT count(DISTINCT problem_id)
  INTO v_problems_solved
  FROM public.user_submissions
  WHERE user_id = v_user_id AND status = 'Accepted';
  
  -- Calculate acceptance rate
  IF v_total > 0 THEN
    v_rate := (v_accepted::FLOAT / v_total::FLOAT * 100)::INT;
  ELSE
    v_rate := 0;
  END IF;
  
  -- Update profile stats
  UPDATE public.profiles
  SET 
    problems_solved = v_problems_solved,
    acceptance_rate = v_rate
  WHERE id = v_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run on insert or update of user_submissions
DROP TRIGGER IF EXISTS trigger_recalc_user_stats ON public.user_submissions;
CREATE TRIGGER trigger_recalc_user_stats
AFTER INSERT OR UPDATE ON public.user_submissions
FOR EACH ROW
EXECUTE FUNCTION public.recalc_user_stats();

-- Recalculate stats for all existing users explicitly
UPDATE public.profiles p
SET 
    problems_solved = (
        SELECT count(DISTINCT problem_id) 
        FROM public.user_submissions 
        WHERE user_id = p.id AND status = 'Accepted'
    ),
    acceptance_rate = COALESCE(
        (
            SELECT (count(*) FILTER (WHERE status = 'Accepted')::FLOAT / NULLIF(count(*), 0)::FLOAT * 100)::INT 
            FROM public.user_submissions 
            WHERE user_id = p.id
        ), 
        0
    );
