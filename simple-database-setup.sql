-- Simple Database Setup - Run this in Supabase SQL Editor
-- This will fix the "user_id does not exist" error

-- First, let's check what columns exist in the courses table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND table_schema = 'public';

-- If the courses table is empty or missing user_id column, recreate it
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS course_files CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create courses table with proper structure
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  priority INTEGER NOT NULL DEFAULT 5,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_slides INTEGER DEFAULT 0,
  completed_slides INTEGER DEFAULT 0,
  processed_chunks JSONB DEFAULT '[]'::jsonb,
  key_concepts TEXT[] DEFAULT '{}',
  total_estimated_time INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  last_processed TIMESTAMP WITH TIME ZONE
);

-- Create course_files table
CREATE TABLE course_files (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uri TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  slides INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_slides INTEGER DEFAULT 0,
  chunks JSONB DEFAULT '[]'::jsonb,
  total_estimated_time INTEGER DEFAULT 0,
  completed_chunks INTEGER DEFAULT 0,
  current_chunk_index INTEGER DEFAULT 0,
  session_progress INTEGER DEFAULT 0,
  learning_objectives TEXT[] DEFAULT '{}',
  assessment_questions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the setup
SELECT 'Database setup completed!' as status;
SELECT 'Courses table columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'courses' AND table_schema = 'public';
