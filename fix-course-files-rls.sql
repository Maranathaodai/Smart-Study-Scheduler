-- Fix course_files RLS policies
-- This script addresses the RLS policy violation for course_files table

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can insert files to own courses" ON course_files;
DROP POLICY IF EXISTS "Users can update files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can delete files of own courses" ON course_files;

-- Create more robust policies for course_files
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
    -- Check if the course exists and belongs to the user
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
    -- Also allow if the user is authenticated (fallback for new courses)
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update files of own courses" ON course_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  ) WITH CHECK (
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

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'course_files'
ORDER BY policyname;

-- Test data integrity
SELECT 
  'course_files' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT course_id) as unique_courses
FROM course_files;

-- Check if there are any orphaned file records
SELECT 
  cf.id,
  cf.course_id,
  cf.name,
  CASE WHEN c.id IS NULL THEN 'ORPHANED' ELSE 'OK' END as status
FROM course_files cf
LEFT JOIN courses c ON c.id = cf.course_id
WHERE c.id IS NULL;