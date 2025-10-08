-- Add missing RLS policies for study_sessions table
-- Run this in Supabase SQL Editor

-- Check current policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;

-- Add the missing policies for study_sessions
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

-- Verify the policies were created
SELECT 'Study sessions policies added!' as status;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;
