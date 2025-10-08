// Network Connectivity Test Script
// Run this to test Supabase connectivity

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hyhbmpzpenooaedfqofm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnectivity() {
  console.log('🌐 Testing Supabase connectivity...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('Failed to fetch')) {
        console.log('\n🔍 Network connectivity issues detected:');
        console.log('- Check your internet connection');
        console.log('- Try refreshing the page');
        console.log('- Check if Supabase is experiencing outages');
        console.log('- Verify your Supabase project is active');
      }
    } else {
      console.log('✅ Connection successful');
    }
    
    // Test 2: Check project status
    console.log('\n2. Checking project status...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Project ID: hyhbmpzpenooaedfqofm');
    
    // Test 3: Try a simple query
    console.log('\n3. Testing simple query...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Query failed:', testError.message);
    } else {
      console.log('✅ Query successful');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('\n🚨 Network Error Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Try using a different network (mobile hotspot)');
      console.log('3. Check if your firewall is blocking the connection');
      console.log('4. Try accessing Supabase dashboard in browser');
      console.log('5. Check Supabase status page for outages');
    }
  }
}

testConnectivity();
