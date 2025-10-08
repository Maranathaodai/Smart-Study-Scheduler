-- Fix Study Sessions RLS Policy Error
-- Run this in your Supabase SQL Editor to fix the column name mismatch

-- Check current state
SELECT 'Current RLS policies for study_sessions:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'study_sessions';

-- Check current table structure
SELECT 'Current study_sessions columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop existing policies to recreate them with correct column names
DROP POLICY IF EXISTS "Users can view own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can create own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can update own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete own study sessions" ON study_sessions;

DROP POLICY IF EXISTS "Users can view sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert sessions to own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can update sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete sessions of own courses" ON study_sessions;

-- Recreate policies with CORRECT column names (using course_id not courseId)
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

-- Verify the fix
SELECT 'RLS Policies Fixed!' as status;
SELECT 'Updated policies for study_sessions:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;

-- Test that we can now create a study session (if you have a course)
SELECT 'Testing if insert now works...' as info;
SELECT 'Current user ID:' as test_info, auth.uid() as user_id;
SELECT 'Available courses:' as test_info;
SELECT id, name, user_id FROM courses WHERE user_id = auth.uid() LIMIT 3;