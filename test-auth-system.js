// Test authentication issues
// This will help identify specific problems with signup and logout

import { supabase } from './src/lib/supabase';
import { authService } from './src/lib/supabaseAuthService';

const testAuthSystem = async () => {
  console.log('🧪 Starting Authentication System Test');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check Supabase connection
    console.log('\n1️⃣ Testing Supabase Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Supabase Connection Error:', connectionError);
      if (connectionError.message.includes('relation "users" does not exist')) {
        console.log('🚨 CRITICAL: Users table does not exist in database!');
        console.log('   Run the supabase-users-table.sql script to create it');
      }
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Test 2: Check current auth status
    console.log('\n2️⃣ Checking Current Auth Status...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Auth Status Error:', userError);
    } else if (user) {
      console.log('✅ User currently signed in:', user.email);
      console.log('   User ID:', user.id);
      console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    } else {
      console.log('ℹ️ No user currently signed in');
    }

    // Test 3: Test logout if user is signed in
    if (user) {
      console.log('\n3️⃣ Testing Logout...');
      try {
        await authService.signOut();
        console.log('✅ Logout successful');
        
        // Verify logout worked
        const { data: { user: afterLogout } } = await supabase.auth.getUser();
        if (afterLogout) {
          console.log('❌ User still signed in after logout');
        } else {
          console.log('✅ User successfully signed out');
        }
      } catch (logoutError) {
        console.log('❌ Logout Error:', logoutError.message);
      }
    }

    // Test 4: Test new user signup
    console.log('\n4️⃣ Testing New User Signup...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';

    try {
      console.log('   Attempting signup with:', testEmail);
      await authService.signUp({
        email: testEmail,
        password: testPassword,
        full_name: testName
      });
      
      console.log('✅ Signup successful');
      
      // Check if user was created in auth
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        console.log('✅ User created in auth system');
        console.log('   User ID:', newUser.id);
        console.log('   Email confirmed:', newUser.email_confirmed_at ? 'Yes' : 'No');
        
        // Check if user was created in users table
        try {
          const { data: userData, error: userTableError } = await supabase
            .from('users')
            .select('*')
            .eq('id', newUser.id)
            .single();
          
          if (userTableError) {
            console.log('❌ Error checking users table:', userTableError.message);
            if (userTableError.code === 'PGRST116') {
              console.log('🚨 User not found in users table - trigger might not be working');
            }
          } else {
            console.log('✅ User found in users table');
            console.log('   Username:', userData.username);
            console.log('   Full name:', userData.full_name);
          }
        } catch (tableError) {
          console.log('❌ Users table query failed:', tableError.message);
        }
        
        // Test logout of new user
        console.log('\n   Testing logout of new user...');
        await authService.signOut();
        console.log('✅ New user logout successful');
        
        // Test immediate login
        console.log('\n   Testing immediate login...');
        try {
          await authService.signIn({ email: testEmail, password: testPassword });
          console.log('✅ Immediate login successful');
          
          // Cleanup - logout again
          await authService.signOut();
        } catch (loginError) {
          console.log('❌ Immediate login failed:', loginError.message);
          if (loginError.message.includes('email not confirmed')) {
            console.log('🚨 Email confirmation required - check your email settings');
          }
        }
        
      } else {
        console.log('❌ User not found after signup');
      }
      
    } catch (signupError) {
      console.log('❌ Signup Error:', signupError.message);
      
      // Common signup error analysis
      if (signupError.message.includes('email_address_invalid')) {
        console.log('   Issue: Invalid email format');
      } else if (signupError.message.includes('password')) {
        console.log('   Issue: Password requirements not met');
      } else if (signupError.message.includes('email_address_not_authorized')) {
        console.log('   Issue: Email domain not allowed');
      } else if (signupError.message.includes('Signup is disabled')) {
        console.log('   Issue: Signup is disabled in Supabase settings');
      }
    }

    // Test 5: Check database policies
    console.log('\n5️⃣ Testing Database Policies...');
    try {
      // Try to insert a test record (should fail if no user signed in)
      const { error: policyError } = await supabase
        .from('users')
        .insert({ 
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@test.com',
          full_name: 'Test'
        });
      
      if (policyError) {
        if (policyError.message.includes('new row violates row-level security')) {
          console.log('✅ RLS policies are working correctly');
        } else {
          console.log('❌ Unexpected policy error:', policyError.message);
        }
      } else {
        console.log('⚠️ Policy test passed - this might indicate RLS is not properly configured');
      }
    } catch (policyTestError) {
      console.log('❌ Policy test failed:', policyTestError.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧪 Authentication System Test Complete');
};

// Run the test
testAuthSystem().catch(console.error);