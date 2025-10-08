-- Quick Database Diagnosis
-- Run this in your Supabase SQL Editor

-- 1. Check if study_sessions table exists
SELECT 'STUDY_SESSIONS TABLE STRUCTURE' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies for study_sessions
SELECT 'STUDY_SESSIONS RLS POLICIES' as section;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'study_sessions';

-- 3. Check courses table structure 
SELECT 'COURSES TABLE STRUCTURE' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check current user
SELECT 'CURRENT USER' as section;
SELECT auth.uid() as user_id;

-- 5. Check existing courses
SELECT 'USER COURSES COUNT' as section;
SELECT COUNT(*) as total_courses
FROM courses 
WHERE user_id = auth.uid();

-- 6. Show sample courses
SELECT 'SAMPLE USER COURSES' as section;
SELECT id, name, created_at
FROM courses 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 3;