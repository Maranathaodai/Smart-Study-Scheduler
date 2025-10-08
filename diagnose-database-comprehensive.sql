-- Comprehensive RLS Diagnosis Script
-- Run this to understand the exact database state

-- 1. Check current database tables and their RLS status
SELECT 'Table and RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('courses', 'study_sessions', 'users') 
AND schemaname = 'public'
ORDER BY tablename;

-- 2. Check exact column names in study_sessions table
SELECT 'study_sessions table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('courses', 'study_sessions')
ORDER BY tablename, policyname;

-- 4. Check if there are any existing courses
SELECT 'Existing courses count:' as info;
SELECT COUNT(*) as course_count FROM courses;

-- 5. Check current user context
SELECT 'Current user context:' as info;
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Not authenticated in SQL context'
    ELSE 'Authenticated'
  END as auth_status;

-- 6. Test the exact RLS policy logic
SELECT 'Testing RLS policy logic manually:' as info;

-- Try to see if any courses exist with user_id
SELECT 'Sample courses:' as info;
SELECT id, name, user_id, created_at 
FROM courses 
LIMIT 3;

-- 7. Check if we can manually create a test study session (this will show the exact error)
SELECT 'Attempting manual test insert (this may fail but will show the error):' as info;

-- First, let's see what a valid course_id would be
SELECT 'Available course IDs:' as info;
SELECT id as course_id 
FROM courses 
LIMIT 1;

-- 8. Show the exact foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('study_sessions', 'courses')
  AND tc.table_schema = 'public';