-- Enhanced Users Table Setup with Better Error Handling
-- Run this in your Supabase SQL Editor to fix authentication issues

-- First, check if table exists and drop if needed for clean setup
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with proper structure
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  username TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  university TEXT DEFAULT '',
  major TEXT DEFAULT '',
  year TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users (for triggers)
CREATE POLICY "service_role_all_users" ON public.users
  FOR ALL USING (current_setting('role') = 'service_role');

-- Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_username TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract user data with proper fallbacks
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_username := COALESCE(
    LOWER(REPLACE(NEW.raw_user_meta_data->>'full_name', ' ', '')), 
    LOWER(REPLACE(COALESCE(NEW.email, ''), '@', '_'))
  );
  
  -- Insert user record with comprehensive data
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    username, 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_username,
    NOW(),
    NOW()
  );
  
  -- Log successful creation
  RAISE NOTICE 'User profile created for: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle duplicate username by appending numbers
    user_username := user_username || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      username, 
      created_at, 
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_username,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'User profile created with unique username: %', user_username;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Users table setup completed successfully!';
  RAISE NOTICE 'Table exists: %', (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users'));
  RAISE NOTICE 'RLS enabled: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'users');
END $$;