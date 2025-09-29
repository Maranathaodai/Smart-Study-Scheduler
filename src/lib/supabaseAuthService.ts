import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class SupabaseAuthService {
  // Sign up new user
  async signUp({ email, password, full_name }: SignUpData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || '',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password',
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error(error.message);
      }
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Update user profile
  async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

export const authService = new SupabaseAuthService();



