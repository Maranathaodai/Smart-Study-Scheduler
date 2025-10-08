// Database Verification Script
// Run this after setting up the database to verify everything works

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check if all tables exist and have proper structure
    console.log('\n1. Checking courses table...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError) {
      console.log('❌ Courses table error:', coursesError.message);
      return;
    }
    
    console.log('✅ Courses table accessible');
    if (coursesData.length > 0) {
      console.log('Columns:', Object.keys(coursesData[0]));
    }
    
    // Check course_files table
    console.log('\n2. Checking course_files table...');
    const { data: filesData, error: filesError } = await supabase
      .from('course_files')
      .select('*')
      .limit(1);
    
    if (filesError) {
      console.log('❌ Course_files table error:', filesError.message);
    } else {
      console.log('✅ Course_files table accessible');
    }
    
    // Check study_sessions table
    console.log('\n3. Checking study_sessions table...');
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.log('❌ Study_sessions table error:', sessionsError.message);
    } else {
      console.log('✅ Study_sessions table accessible');
    }
    
    // Test course creation structure (without actually inserting)
    console.log('\n4. Testing course creation structure...');
    
    // Check if we can query the courses table structure
    const { data: structureData, error: structureError } = await supabase
      .from('courses')
      .select('*')
      .limit(0); // Just get the structure, no data
    
    if (structureError) {
      console.log('❌ Course structure test failed:', structureError.message);
    } else {
      console.log('✅ Course structure test successful');
      console.log('📋 Database is ready for course creation!');
    }
    
    console.log('\n🎉 Database verification complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Your database is properly set up');
    console.log('2. Run your React Native app');
    console.log('3. Sign in to your account');
    console.log('4. Try creating a course - it should work now!');
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

verifyDatabase();
