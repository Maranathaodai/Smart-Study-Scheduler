// Database Setup Script for Smart Study Scheduler
// Run this in your browser console or as a Node.js script

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🗄️ Setting up Smart Study Scheduler database...');
  
  try {
    // Test connection first
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Check if courses table exists
    console.log('Checking if courses table exists...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (coursesError && coursesError.message.includes('does not exist')) {
      console.log('❌ Courses table does not exist');
      console.log('');
      console.log('📋 You need to create the database tables manually:');
      console.log('');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project: hyhbmpzpenooaedfqofm');
      console.log('3. Go to SQL Editor');
      console.log('4. Run the SQL script from: supabase-courses-schema.sql');
      console.log('');
      console.log('The script contains:');
      console.log('- CREATE TABLE courses');
      console.log('- CREATE TABLE course_files');
      console.log('- CREATE TABLE study_sessions');
      console.log('- Row Level Security policies');
      console.log('- Proper indexes');
      console.log('');
      console.log('⚠️  This must be done manually in the Supabase dashboard!');
    } else if (coursesError) {
      console.error('❌ Error checking courses table:', coursesError);
    } else {
      console.log('✅ Courses table exists');
      console.log('Database setup appears to be complete!');
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run the setup
setupDatabase();
