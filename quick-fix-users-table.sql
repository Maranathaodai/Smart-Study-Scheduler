-- Quick fix for users table - remove username column requirement
-- Run this in Supabase SQL Editor to fix the current error

-- First check what columns actually exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- If username column doesn't exist but code expects it, let's add it
-- This will only run if the column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'username' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column to users table';
    ELSE
        RAISE NOTICE 'Username column already exists';
    END IF;
END $$;

-- Create index for username if it was added
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

RAISE NOTICE 'Users table structure check completed';