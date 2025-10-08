-- Check Database State and Fix Missing Data
-- Run this in Supabase SQL Editor

-- Check if there are any courses
SELECT 'Courses in database:' as info;
SELECT COUNT(*) as course_count FROM courses;

-- Check if there are any users
SELECT 'Users in database:' as info;
SELECT COUNT(*) as user_count FROM users;

-- Check if there are any courses with proper user_id
SELECT 'Courses with user_id:' as info;
SELECT id, name, user_id, created_at 
FROM courses 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any users in auth.users
SELECT 'Users in auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- If no courses exist, create a test course
-- First check if we have any users
DO $$
DECLARE
    user_count INTEGER;
    course_count INTEGER;
    test_user_id UUID;
BEGIN
    -- Count users and courses
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO course_count FROM courses;
    
    RAISE NOTICE 'Users in auth.users: %', user_count;
    RAISE NOTICE 'Courses in courses table: %', course_count;
    
    -- If no courses exist, create a test course
    IF course_count = 0 THEN
        -- Get the first user from auth.users
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
        
        IF test_user_id IS NOT NULL THEN
            -- Create a test course
            INSERT INTO courses (
                id,
                name,
                category,
                difficulty,
                priority,
                color,
                user_id,
                total_slides,
                completed_slides,
                processed_chunks,
                key_concepts,
                total_estimated_time,
                processing_status
            ) VALUES (
                'test-course-' || extract(epoch from now()),
                'Test Course',
                'General',
                'medium',
                5,
                '#3B82F6',
                test_user_id,
                10,
                0,
                '[]'::jsonb,
                '{}',
                60,
                'completed'
            );
            
            RAISE NOTICE 'Created test course for user: %', test_user_id;
        ELSE
            RAISE NOTICE 'No users found in auth.users - cannot create test course';
        END IF;
    ELSE
        RAISE NOTICE 'Courses already exist - no test course needed';
    END IF;
END $$;

-- Verify the fix
SELECT 'Final state:' as info;
SELECT COUNT(*) as course_count FROM courses;
SELECT COUNT(*) as user_count FROM auth.users;

-- Show sample course
SELECT 'Sample course:' as info;
SELECT id, name, user_id FROM courses LIMIT 1;
