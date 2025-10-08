-- Fix User ID Mismatch and Check Authentication
-- Run this in Supabase SQL Editor

-- Check current user authentication
SELECT 'Current authenticated user:' as info;
SELECT auth.uid() as current_user_id;

-- Check what users exist in auth.users
SELECT 'Users in auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Check what courses exist and their user_ids
SELECT 'Current courses:' as info;
SELECT id, name, user_id, created_at 
FROM courses 
ORDER BY created_at DESC;

-- Update the test course to use the current authenticated user
UPDATE courses 
SET user_id = auth.uid()
WHERE name = 'Test Course' 
AND auth.uid() IS NOT NULL;

-- Verify the update
SELECT 'Updated courses:' as info;
SELECT id, name, user_id, created_at 
FROM courses 
ORDER BY created_at DESC;

-- Test if we can now create a study session
SELECT 'Testing study session creation:' as info;
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
  (SELECT id FROM courses WHERE user_id = auth.uid() LIMIT 1),
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

-- Clean up test session
DELETE FROM study_sessions WHERE id LIKE 'test-session-%';

SELECT 'Test completed successfully!' as status;
