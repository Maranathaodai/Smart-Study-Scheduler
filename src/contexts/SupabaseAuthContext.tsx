import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
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
      
      // Sign out the user immediately after signup so they have to login manually
      if (data.session) {
        console.log('🚪 Signing out user to prevent automatic login...');
        await supabase.auth.signOut();
        console.log('✅ User signed out - must sign in manually');
      }
      
      console.log('✅ Account creation complete - user must sign in manually');
      
    } catch (error: any) {
      console.error('Signup process failed:', error);
      throw error;
    }
  };

  const signIn = async (emailOrName: string, password: string) => {
    console.log('Attempting sign in with:', emailOrName);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrName,
      password,
    });

    console.log('Sign in result:', { data, error });

    if (error) {
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

      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('Password update failed:', error);
      throw error;
    }
  };

  const confirmUserEmail = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Email confirmation error:', error);
        return false;
      }

      console.log('Email confirmation sent:', data);
      return true;
    } catch (error) {
      console.error('Email confirmation failed:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    confirmUserEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};