const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from supabase.ts
const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCourseFilesAccess() {
  try {
    console.log('🧪 Testing course_files table access after RLS fix...\n');

    // Test 1: Basic table access
    console.log('📋 Test 1: Basic table access');
    const { data: files, error: filesError } = await supabase
      .from('course_files')
      .select('*')
      .limit(1);

    if (filesError) {
      console.log('❌ Error accessing course_files:', filesError.message);
      if (filesError.message.includes('row-level security policy')) {
        console.log('⚠️  RLS policies still blocking access - SQL fix may not have been applied');
      }
    } else {
      console.log('✅ Successfully accessed course_files table');
      console.log('📊 Files found:', files?.length || 0);
    }

    // Test 2: Courses table access
    console.log('\n📚 Test 2: Courses table access');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name, user_id')
      .limit(3);

    if (coursesError) {
      console.log('❌ Error accessing courses:', coursesError.message);
    } else {
      console.log('✅ Successfully accessed courses table');
      console.log('📊 Courses found:', courses?.length || 0);
      if (courses && courses.length > 0) {
        console.log('📋 Sample course IDs:', courses.map(c => c.id));
      }
    }

    // Test 3: Attempt a test insert (will fail due to auth, but should show different error)
    console.log('\n🔬 Test 3: Test insert attempt');
    const { data: insertData, error: insertError } = await supabase
      .from('course_files')
      .insert({
        id: 'test-file-id',
        course_id: 'test-course-id',
        name: 'test-file.pdf',
        size: 1024,
        type: 'application/pdf',
        uri: null
      });

    if (insertError) {
      console.log('❌ Insert error (expected):', insertError.message);
      if (insertError.message.includes('row-level security policy')) {
        console.log('⚠️  RLS policies still active - this is the core issue');
        console.log('🔧 Please apply the SQL fix in your Supabase dashboard');
      } else if (insertError.message.includes('foreign key') || insertError.message.includes('violates check constraint')) {
        console.log('✅ RLS policies are working! Error is due to invalid test data (expected)');
      } else if (insertError.message.includes('auth')) {
        console.log('✅ RLS policies allow insert but auth is required (expected)');
      }
    } else {
      console.log('✅ Insert succeeded (unexpected but good!)');
    }

    console.log('\n📋 Summary:');
    console.log('- If you see "row-level security policy" errors, apply the SQL fix');
    console.log('- If you see foreign key or auth errors, the RLS fix is working');
    console.log('- Test actual file upload in the app after applying the SQL fix');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testCourseFilesAccess();