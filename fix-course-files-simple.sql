-- Simplified course_files RLS policy fix
-- This addresses RLS policy violations with a more permissive approach

-- First, temporarily disable RLS to allow emergency fixes
ALTER TABLE course_files DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can insert files to own courses" ON course_files;
DROP POLICY IF EXISTS "Users can update files of own courses" ON course_files;
DROP POLICY IF EXISTS "Users can delete files of own courses" ON course_files;

-- Re-enable RLS
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;

-- Create simplified, more permissive policies
CREATE POLICY "course_files_select_policy" ON course_files
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_insert_policy" ON course_files
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_update_policy" ON course_files
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_delete_policy" ON course_files
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- Verify the policy is created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'course_files';

-- Check current authentication
SELECT 
  auth.uid() as current_user_id,
  COUNT(*) as total_courses
FROM courses
WHERE user_id = auth.uid();

-- Test data integrity
SELECT 
  'course_files' as table_name,
  COUNT(*) as total_rows
FROM course_files;