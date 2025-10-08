-- Simple RLS Fix for Study Sessions
-- Run this in your Supabase SQL Editor

-- 1. Check if study_sessions table exists and has correct structure
SELECT 'Checking study_sessions table structure...' as status;

-- 2. Disable RLS temporarily to test inserts
ALTER TABLE study_sessions DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies and recreate them correctly
DROP POLICY IF EXISTS "Users can view sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert sessions to own courses" ON study_sessions; 
DROP POLICY IF EXISTS "Users can update sessions of own courses" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete sessions of own courses" ON study_sessions;

-- 5. Create new simplified policies
CREATE POLICY "study_sessions_select_policy" ON study_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "study_sessions_insert_policy" ON study_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "study_sessions_update_policy" ON study_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "study_sessions_delete_policy" ON study_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = study_sessions.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- 6. Verify the policies are created
SELECT 'Policies created successfully!' as status;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;