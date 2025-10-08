-- Diagnose RLS Policy Issues for study_sessions
-- Run this in Supabase SQL Editor

-- Check if policies exist
SELECT 'Current study_sessions policies:' as info;
SELECT policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'study_sessions'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'study_sessions';

-- Test the policy logic manually
SELECT 'Testing policy logic:' as info;
SELECT 
  'Current user ID' as test_type,
  auth.uid() as current_user_id;

-- Check if there are any courses with user_id
SELECT 'Sample courses with user_id:' as info;
SELECT id, name, user_id 
FROM courses 
LIMIT 3;

-- Check if there are any existing study_sessions
SELECT 'Existing study_sessions:' as info;
SELECT id, course_id, date 
FROM study_sessions 
LIMIT 3;

-- Test if we can insert a test session (this will show the exact error)
SELECT 'Testing insert permission:' as info;
-- This will fail but show us the exact error
INSERT INTO study_sessions (
  id, 
  course_id, 
  date, 
  slides, 
  completed, 
  completed_slides,
  chunks,
  total_estimated_time,
  completed_chunks,
  current_chunk_index,
  session_progress,
  learning_objectives,
  assessment_questions
) VALUES (
  'test-session-' || extract(epoch from now()),
  (SELECT id FROM courses LIMIT 1),
  now(),
  5,
  false,
  0,
  '[]'::jsonb,
  30,
  0,
  0,
  0,
  '{}',
  '{}'
);
