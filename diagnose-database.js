// Detailed Database Diagnostic Script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseDatabase() {
  console.log('🔍 Diagnosing database issues...');
  
  try {
    // Check courses table structure
    console.log('\n1. Checking courses table structure...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError) {
      console.log('❌ Courses table error:', coursesError.message);
      
      if (coursesError.message.includes('user_id does not exist')) {
        console.log('\n🔧 Issue found: The courses table exists but is missing the user_id column!');
        console.log('\n📋 Solution:');
        console.log('1. Go to Supabase dashboard → SQL Editor');
        console.log('2. Run this SQL command:');
        console.log('');
        console.log('ALTER TABLE courses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
        console.log('');
        console.log('3. Then run:');
        console.log('ALTER TABLE courses ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('4. Create RLS policy:');
        console.log('CREATE POLICY "Users can view own courses" ON courses FOR SELECT USING (auth.uid() = user_id);');
      }
    } else {
      console.log('✅ Courses table accessible');
      console.log('Columns found:', Object.keys(coursesData[0] || {}));
    }
    
    // Check if user is authenticated
    console.log('\n2. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      console.log('User ID:', user.id);
    } else {
      console.log('⚠️  No user authenticated');
    }
    
    // Test with specific user_id query
    if (user) {
      console.log('\n3. Testing user_id query...');
      const { data: userCourses, error: userCoursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (userCoursesError) {
        console.log('❌ User courses query error:', userCoursesError.message);
      } else {
        console.log('✅ User courses query successful');
        console.log('User courses count:', userCourses.length);
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

diagnoseDatabase();
