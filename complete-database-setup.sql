-- Complete Database Setup for Smart Study Scheduler
-- Run this in your Supabase SQL Editor

-- First, drop existing incomplete tables if they exist
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

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for courses table
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for course_files table
CREATE POLICY "Users can view files of own courses" ON course_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files to own courses" ON course_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files of own courses" ON course_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of own courses" ON course_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- Create policies for study_sessions table
CREATE POLICY "Users can view sessions of own courses" ON study_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sessions to own courses" ON study_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions of own courses" ON study_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sessions of own courses" ON study_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON course_files(course_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_course_id ON study_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON study_sessions(completed);

-- Insert a test course to verify the setup
INSERT INTO courses (id, name, category, difficulty, priority, color, user_id) 
VALUES ('test-course-1', 'Test Course', 'General', 'medium', 5, '#3B82F6', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('courses', 'course_files', 'study_sessions');
