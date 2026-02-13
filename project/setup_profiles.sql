-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  rating INTEGER DEFAULT 1500,
  streak INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to manage their own profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Additional policy to allow profile creation during signup
CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Enable select for all users" ON profiles FOR SELECT USING (auth.uid() = id);
