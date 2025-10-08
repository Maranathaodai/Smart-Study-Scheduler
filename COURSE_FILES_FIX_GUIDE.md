# Course Files RLS Policy Fix - Complete Guide

## Issue Summary
Users are getting "ERROR Add files to course error: new row violates row-level security policy for table course_files" when trying to upload files to courses.

## Root Cause
The RLS (Row Level Security) policies on the `course_files` table are too restrictive and don't properly allow users to insert files into courses they own.

## Solution

### Step 1: Apply SQL Fix in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/hyhbmpzpenooaedfqofm
2. Navigate to "SQL Editor"
3. Paste and execute the following SQL:

```sql
-- Fix course_files RLS policies
-- This script replaces restrictive policies with simplified ones

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own course files" ON course_files;
DROP POLICY IF EXISTS "Users can only insert files to their own courses" ON course_files;
DROP POLICY IF EXISTS "Users can only update their own course files" ON course_files;
DROP POLICY IF EXISTS "Users can only delete their own course files" ON course_files;

-- Create simplified RLS policies for course_files
CREATE POLICY "course_files_select_policy" ON course_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_insert_policy" ON course_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_update_policy" ON course_files
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "course_files_delete_policy" ON course_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_files.course_id 
      AND courses.user_id = auth.uid()
    )
  );

-- Verify RLS is enabled
SELECT 'RLS enabled on course_files: ' || CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as status
FROM pg_class 
WHERE relname = 'course_files';

-- Show new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'course_files'
ORDER BY policyname;
```

### Step 2: Test the Fix

After applying the SQL fix, test file upload functionality:

1. Open your Smart Study Scheduler app
2. Go to a course
3. Try uploading a file
4. The upload should now work without RLS policy violations

### Step 3: Verify Enhanced File Processing

The file processing has been enhanced to include:
- ✅ Better PDF extraction with structured content analysis
- ✅ Image content analysis with educational context
- ✅ Improved chunking for better AI processing
- ✅ Support for multiple file formats (PDF, images, Office docs, HTML, markdown)
- ✅ Intelligent fallbacks for failed processing
- ✅ Consistent processing between file uploads and manual content

## Technical Details

### What Changed in the Code:
- Enhanced `ContentProcessor` with format-specific extraction methods
- Improved AI prompts in `OpenRouter` for educational content
- Added validation and debugging to `SupabaseCourseService.addFilesToCourse()`
- Both file uploads and manual content now use the same `createIntelligentChunks()` method

### What Changed in the Database:
- Simplified RLS policies that properly check course ownership
- Removed overly complex policy conditions that were causing failures
- Maintained security while allowing legitimate file uploads

## Troubleshooting

If you still get errors after applying the SQL fix:

1. Check the console logs for detailed error messages
2. Verify the course exists and belongs to the current user
3. Ensure the user is properly authenticated
4. Check if there are any foreign key constraint violations

The enhanced `addFilesToCourse()` method now includes detailed logging to help diagnose any remaining issues.