-- Complete Fix: Create Course and Test Study Sessions
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

-- If no courses exist for current user, create one
DO $$
DECLARE
    current_user_id UUID;
    course_count INTEGER;
    new_course_id TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please log in first.';
        RETURN;
    END IF;
    
    -- Check if user has any courses
    SELECT COUNT(*) INTO course_count 
    FROM courses 
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'User % has % courses', current_user_id, course_count;
    
    -- If no courses exist, create one
    IF course_count = 0 THEN
        new_course_id := 'course-' || extract(epoch from now())::text;
        
        INSERT INTO courses (
            id,
            name,
            description,
            user_id,
            total_slides,
            completed_slides,
            processing_status,
            created_at,
            updated_at
        ) VALUES (
            new_course_id,
            'Test Course for ' || current_user_id,
            'This is a test course created to verify database functionality.',
            current_user_id,
            10,
            0,
            'completed',
            now(),
            now()
        );
        
        RAISE NOTICE 'Created test course: %', new_course_id;
    ELSE
        -- Get the first course ID
        SELECT id INTO new_course_id 
        FROM courses 
        WHERE user_id = current_user_id 
        LIMIT 1;
        
        RAISE NOTICE 'Using existing course: %', new_course_id;
    END IF;
    
    -- Now test study session creation
    BEGIN
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
            new_course_id,
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
        
        RAISE NOTICE 'Successfully created test study session!';
        
        -- Clean up test session
        DELETE FROM study_sessions WHERE id LIKE 'test-session-%';
        RAISE NOTICE 'Cleaned up test session';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create study session: %', SQLERRM;
    END;
    
END $$;

-- Verify the final state
SELECT 'Final verification:' as info;
SELECT 'Courses for current user:' as status;
SELECT id, name, user_id, created_at 
FROM courses 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

SELECT 'Study sessions test completed!' as status;
