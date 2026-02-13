-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Use UUID for internal ID, but we might want to preserve the string ID from data as a separate field or use it if it's compatible
  external_id TEXT, -- To store the '1', '2' etc from the data file
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  acceptance_rate NUMERIC(5, 2),
  companies TEXT[] DEFAULT '{}',
  platform TEXT NOT NULL CHECK (platform IN ('leetcode', 'codeforces', 'codechef', 'gfg', 'hackerrank', 'codeforge', 'geeksforgeeks')),
  description TEXT,
  examples JSONB DEFAULT '[]'::jsonb, -- Store examples as JSON
  constraints TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS problems_difficulty_idx ON problems(difficulty);
CREATE INDEX IF NOT EXISTS problems_platform_idx ON problems(platform);
CREATE INDEX IF NOT EXISTS problems_slug_idx ON problems(slug);

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view problems
CREATE POLICY "Everyone can view problems"
  ON problems
  FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert/update/delete (for now we'll allow all authenticated to insert for seeding purposes, then restrict)
-- Ideally, you'd have an 'admin' role. For now, we'll just allow authenticated users to do everything for development ease, 
-- or strictly, maybe just allow public read and no write from client (writes happen via SQL editor).
-- Let's stick to: Public Read, No Client Write (updates via SQL/Dashboard only).

-- If we need to seed from client, we need insert policy. But we are seeding via SQL script, so we don't need Insert policy for client.
