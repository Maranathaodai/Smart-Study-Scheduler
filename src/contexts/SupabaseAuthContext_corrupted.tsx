import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, testSupabaseConnection, debugUsers } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (emailOrName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  confirmUserEmail: (email: string) => Promise<boolean>;
}ct, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, testSupabaseConnection, debugUser    // I    // If that fails and the string doesn't contain @, try to find user by full name
    if (error && !emailOrName.includes('@')) {
      console.log('Trying to find user by full name:', emailOrName);
      
      // Normalize the name for search (remove spaces, convert to lowercase)
      const normalizedName = emailOrName.toLowerCase().replace(/\s+/g, '');
      
      try {
        // Try to query the users table for full name match
        const { data: users, error: queryError } = await supabase
          .from('users')
          .select('email, full_name')
          .ilike('full_name', `%${emailOrName}%`)
          .limit(1);nd the string doesn't contain @, try to find user by full name
    if (error && !emailOrName.includes('@')) {
      console.log('Trying to find user by full name:', emailOrName);
      
      // Normalize the search term (remove spaces, convert to lowercase)
      const normalizedName = emailOrName.toLowerCase().replace(/\s+/g, '');
      
      try {
        // Try to query the users table for full name match'../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (emailOrName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  confirmUserEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Supabase connection first
    testSupabaseConnection();
    
    // Debug: Check what users exist in the database
    debugUsers();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('Signing up user:', { email, fullName });
    
    try {
      // Use signUp with email confirmation enabled to prevent auto-login
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
          // Enable email confirmation to prevent auto-login
          emailRedirectTo: window?.location?.origin || 'https://yourapp.com',
        },
      });

      console.log('Signup result:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user account. Please try again.');
      }

      console.log('✅ User account created:', data.user.email);
      
      // The user is NOT automatically signed in due to email confirmation requirement
      // They need to confirm their email first, then sign in manually
      
      // If somehow they got signed in anyway, sign them out
      if (data.session) {
        console.log('🚪 Signing out user to prevent automatic login...');
        await supabase.auth.signOut();
        console.log('✅ User signed out - must sign in manually');
      }
      
      console.log('✅ Account creation complete - user must sign in manually');
      
      // Check if user was created in the users table
      try {
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log('Users table check:', { userData, userError });
        
        // If user doesn't exist in users table, create the record manually
        if (userError && userError.code === 'PGRST116') { // No rows found
          console.log('Creating user record manually...');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (insertError) {
            console.error('Error creating user record:', insertError);
            // Continue anyway - auth user is still created
          } else {
            console.log('✅ User record created successfully');
          }
        } else if (userData) {
          console.log('✅ User record found in users table');
        }
      } catch (tableError) {
        console.log('⚠️ Users table operation warning:', tableError);
        // Don't throw error - auth user is still created successfully
      }
      
      // Sign out the user immediately after signup so they have to login
      console.log('🚪 Signing out user after signup to require manual login...');
      await supabase.auth.signOut();
      console.log('✅ Account created successfully! User needs to sign in manually.');
      
    } catch (error: any) {
      console.error('Signup process failed:', error);
      throw error;
    }
  };

  const signIn = async (emailOrName: string, password: string) => {
    console.log('Attempting sign in with:', emailOrName);
    
    // First try to sign in with the provided string as email
    let { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrName,
      password,
    });

    console.log('Sign in result:', { data, error });

    // Handle email confirmation error specifically
    if (error && error.message.includes('email not confirmed')) {
      console.log('Email not confirmed error detected. Attempting to resend confirmation...');
      
      // Try to resend confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailOrName,
      });
      
      if (resendError) {
        console.error('Failed to resend confirmation:', resendError);
        throw new Error('Email not confirmed. Please check your email for confirmation link or contact support.');
      } else {
        throw new Error('Email not confirmed. Confirmation email has been resent. Please check your email.');
      }
    }

    // If that fails and the string doesn't contain @, try to find user by username
    if (error && !emailOrName.includes('@')) {
      console.log('Trying to find user by username:', emailOrName);
      
      // Normalize the username (remove spaces, convert to lowercase)
      const normalizedUsername = emailOrName.toLowerCase().replace(/\s+/g, '');
      
      try {
        // Try to query the users table for full name match
        const { data: users, error: queryError } = await supabase
          .from('users')
          .select('email, full_name')
          .ilike('full_name', `%${emailOrName}%`)
          .limit(1);

        console.log('Users table query result:', { users, queryError });

        if (!queryError && users && users.length > 0) {
          console.log('Found user by full name in users table:', users[0]);
          // Found user by full name, try to sign in with their email
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: users[0].email,
            password,
          });

          if (signInError) {
            console.error('Sign in error with found email:', signInError);
            throw new Error(signInError.message);
          }
          return; // Success, exit the function
        }
      } catch (tableError) {
        console.log('Users table query failed, trying Supabase Auth metadata lookup:', tableError);
      }

      // Fallback: Try to find user by searching through auth users metadata
      // This is a more complex approach but works without a separate users table
      console.log('Trying Supabase Auth metadata lookup...');
      
      // Since we can't directly query auth.users, we'll try common email patterns
      // This is not ideal but works as a fallback
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      const usernameVariations = [
        normalizedUsername,
        emailOrName.toLowerCase().replace(/\s+/g, '.'),
        emailOrName.toLowerCase().replace(/\s+/g, '_'),
      ];

      for (const username of usernameVariations) {
        for (const domain of commonDomains) {
          const testEmail = `${username}@${domain}`;
          console.log(`Trying email: ${testEmail}`);
          
          try {
            const { error: testError } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password,
            });

            if (!testError) {
              console.log(`Successfully signed in with email: ${testEmail}`);
              return; // Success!
            }
          } catch (testSignInError) {
            // Continue trying other combinations
            continue;
          }
        }
      }
      
      // If all attempts fail, throw a helpful error
      throw new Error(`Name "${emailOrName}" not found. Please check your name or use your email address to sign in.`);
    } else if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Signout error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ User signed out successfully');
      
      // Clear any cached data
      setUser(null);
      setSession(null);
      
    } catch (error: any) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://your-app.com/reset-password',
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  // Update user password
  const updatePassword = async (newPassword: string) => {
    try {
      console.log('Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        throw new Error(error.message);
      }

      console.log('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Helper function to manually confirm user email (for development)
  const confirmUserEmail = async (email: string) => {
    try {
      // This is a workaround for development - manually update the user's email_confirmed_at
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email === email) {
        // Update the user's email_confirmed_at timestamp
        const { error } = await supabase.auth.updateUser({
          data: { email_confirmed_at: new Date().toISOString() }
        });
        
        if (error) {
          console.error('Failed to confirm email:', error);
          return false;
        }
        
        console.log('Email confirmed successfully');
        return true;
      }
    } catch (error) {
      console.error('Error confirming email:', error);
    }
    return false;
  };


  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    confirmUserEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


