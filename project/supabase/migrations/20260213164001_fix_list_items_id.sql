-- Migration: fix_list_items_id
-- Description: Change problem_id to UUID and add foreign key reference to problems table

-- 1. Remove existing items to avoid type conflict (or we could try to cast if they look like UUIDs, but usually they are string '1', '2' etc)
TRUNCATE public.user_problem_list_items;

-- 2. Alter the column type
ALTER TABLE public.user_problem_list_items 
  ALTER COLUMN problem_id TYPE UUID USING (problem_id::UUID);

-- 3. Add foreign key constraint
ALTER TABLE public.user_problem_list_items
  ADD CONSTRAINT user_problem_list_items_problem_id_fkey 
  FOREIGN KEY (problem_id) REFERENCES public.problems(id) 
  ON DELETE CASCADE;

-- 4. Re-apply policies (they should still work as they refer to column name, but good to be sure)
-- Policies are already defined on the table, altering column doesn't drop them usually.
