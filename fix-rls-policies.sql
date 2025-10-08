-- Fix Row Level Security Policies for Study Sessions
-- Run this in your Supabase SQL Editor

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('courses', 'study_sessions', 'course_files')
ORDER BY tablename, policyname;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert sessions to own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can update sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete sessions of own courses" ON study_sessions;

DROP POLICY IF EXISTS "Users can view own courses" ON courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON courses;

DROP POLICY IF EXISTS "Users can view files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can insert files to own courses" ON course_files;
DROP POLICY IF EXISTS "Users can update files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can delete files of own courses" ON course_files;

DROP POLICY IF EXISTS "Users can manage files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can manage sessions of own courses" ON study_sessions;

-- Recreate policies with proper syntax
-- Courses policies
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- Study sessions policies - Fixed to properly check course ownership
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

-- Course files policies
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

-- Verify policies are created
SELECT 'RLS Policies Fixed!' as status;
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('courses', 'study_sessions', 'course_files')
ORDER BY tablename, policyname;
