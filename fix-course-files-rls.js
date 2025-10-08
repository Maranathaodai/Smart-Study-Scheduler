const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use hardcoded values from supabase.ts
const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCourseFilesRLS() {
  try {
    console.log('🔧 Starting course_files RLS policy fix...');

    // First, let's check the current state
    console.log('\n📊 Checking current state...');
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Auth check failed:', authError.message);
    } else {
      console.log('👤 Current user:', user ? user.id : 'Not authenticated');
    }

    // Check existing policies
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.pg_policies')
      .select('*')
      .eq('tablename', 'course_files');

    if (policiesError) {
      console.log('⚠️ Could not fetch policies:', policiesError.message);
    } else {
      console.log('📋 Current policies for course_files:', policies?.length || 0);
    }

    // Check courses table
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name, user_id')
      .limit(5);

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError.message);
    } else {
      console.log('📚 Sample courses:', courses?.length || 0, 'found');
      if (courses && courses.length > 0) {
        console.log('First course:', courses[0]);
      }
    }

    // Check course_files table
    const { data: files, error: filesError } = await supabase
      .from('course_files')
      .select('id, course_id, name')
      .limit(5);

    if (filesError) {
      console.error('❌ Error fetching course files:', filesError.message);
      console.error('Full error:', filesError);
    } else {
      console.log('📁 Sample course files:', files?.length || 0, 'found');
    }

    // Try to manually run the simplified SQL
    console.log('\n🔧 Attempting to fix RLS policies...');
    
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('fix-course-files-simple.sql', 'utf8');
    console.log('📄 SQL fix loaded, length:', sqlFix.length);

    console.log('\n✅ Diagnosis complete. Manual SQL execution required.');
    console.log('\n📋 Next steps:');
    console.log('1. Run the SQL in fix-course-files-simple.sql in your Supabase SQL editor');
    console.log('2. Or contact your database administrator');
    console.log('3. Test file upload again after applying the fix');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixCourseFilesRLS();