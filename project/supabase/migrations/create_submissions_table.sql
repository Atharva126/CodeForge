-- Create user_submissions table
CREATE TABLE IF NOT EXISTS public.user_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error')),
    language TEXT NOT NULL,
    code TEXT,
    runtime FLOAT, -- in ms
    memory FLOAT, -- in MB
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own submissions" 
    ON public.user_submissions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" 
    ON public.user_submissions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create simple index for fetching user history
CREATE INDEX IF NOT EXISTS user_submissions_user_id_idx ON public.user_submissions(user_id);
CREATE INDEX IF NOT EXISTS user_submissions_submitted_at_idx ON public.user_submissions(submitted_at);

-- Create user_problem_status table for quick lookups (Solved/Attempted)
CREATE TABLE IF NOT EXISTS public.user_problem_status (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Solved', 'Attempted')),
    last_submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.user_problem_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own problem status" 
    ON public.user_problem_status FOR SELECT 
    USING (auth.uid() = user_id);
    
CREATE POLICY "System can update problem status" 
    ON public.user_problem_status FOR ALL
    USING (auth.uid() = user_id);

-- Trigger to update user_problem_status on submission
CREATE OR REPLACE FUNCTION public.handle_new_submission()
RETURNS TRIGGER AS $$
DECLARE
    is_already_solved BOOLEAN;
BEGIN
    -- Check if problem was already solved by this user
    SELECT EXISTS (
        SELECT 1 FROM public.user_problem_status 
        WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id AND status = 'Solved'
    ) INTO is_already_solved;

    -- If submission is Accepted, mark as Solved
    IF NEW.status = 'Accepted' THEN
        INSERT INTO public.user_problem_status (user_id, problem_id, status, last_submitted_at)
        VALUES (NEW.user_id, NEW.problem_id, 'Solved', NEW.submitted_at)
        ON CONFLICT (user_id, problem_id) 
        DO UPDATE SET status = 'Solved', last_submitted_at = NEW.submitted_at;
        
        -- If it wasn't already solved, increment the profile count
        IF NOT is_already_solved THEN
            UPDATE public.profiles 
            SET problems_solved = problems_solved + 1
            WHERE id = NEW.user_id;
        END IF;
    ELSE
        -- Mark as Attempted if not already Solved
        INSERT INTO public.user_problem_status (user_id, problem_id, status, last_submitted_at)
        VALUES (NEW.user_id, NEW.problem_id, 'Attempted', NEW.submitted_at)
        ON CONFLICT (user_id, problem_id) 
        DO UPDATE SET last_submitted_at = NEW.submitted_at WHERE user_problem_status.status != 'Solved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_submission_created ON public.user_submissions;
CREATE TRIGGER on_submission_created
AFTER INSERT ON public.user_submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_new_submission();
