import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Hardcoded for testing
const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

// Debug logging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Not set');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in AsyncStorage
    persistSession: true,
    // Detect session from URL
    detectSessionInUrl: false,
    // Disable email confirmation requirement
    flowType: 'implicit',
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  COURSES: 'courses',
  STUDY_SESSIONS: 'study_sessions',
  COURSE_FILES: 'course_files',
  USER_PROGRESS: 'user_progress',
} as const;

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return false;
  }
};

// Debug function to check all users in the database
export const debugUsers = async () => {
  try {
    console.log('Checking all users in database...');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('Users in database:', users);
    return users;
  } catch (err) {
    console.error('Error in debugUsers:', err);
  }
};

export default supabase;
