-- Drop table if it exists to ensure we start fresh with correct schema
DROP TABLE IF EXISTS problems CASCADE;

-- Create problems table
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  acceptance_rate NUMERIC(5, 2),
  companies TEXT[] DEFAULT '{}',
  platform TEXT NOT NULL CHECK (platform IN ('leetcode', 'codeforces', 'codechef', 'gfg', 'hackerrank', 'codeforge', 'geeksforgeeks')),
  description TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  constraints TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX problems_difficulty_idx ON problems(difficulty);
CREATE INDEX problems_platform_idx ON problems(platform);
CREATE INDEX problems_slug_idx ON problems(slug);

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view problems"
  ON problems
  FOR SELECT
  USING (true);
