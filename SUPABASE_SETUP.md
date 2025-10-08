# Supabase Setup Guide for Smart Study Scheduler

## 🚀 **Complete Free Backend Setup**

Supabase provides a completely free backend with no billing requirements for development and small-scale usage.

## **Step 1: Create Supabase Account**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. **No billing required!**

## **Step 2: Create New Project**

1. Click "New project"
2. Choose your organization
3. **Project name**: `smart-study-scheduler`
4. **Database password**: Generate a strong password (save it!)
5. **Region**: Choose closest to your location
6. Click "Create new project"

## **Step 3: Get Configuration Keys**

After project creation (takes 2-3 minutes):

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## **Step 4: Update Environment Variables**

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## **Step 5: Create Database Tables**

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  priority INTEGER NOT NULL DEFAULT 5,
  color TEXT NOT NULL,
  userId UUID REFERENCES auth.users(id) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  totalSlides INTEGER DEFAULT 0,
  completedSlides INTEGER DEFAULT 0,
  files JSONB DEFAULT '[]',
  processedChunks JSONB DEFAULT '[]',
  keyConcepts JSONB DEFAULT '[]',
  totalEstimatedTime INTEGER DEFAULT 0,
  processingStatus TEXT DEFAULT 'pending' CHECK (processingStatus IN ('pending', 'processing', 'completed', 'failed')),
  lastProcessed TIMESTAMP WITH TIME ZONE
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  courseId TEXT REFERENCES courses(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  slides INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completedSlides INTEGER DEFAULT 0,
  chunks JSONB DEFAULT '[]',
  totalEstimatedTime INTEGER DEFAULT 0,
  completedChunks INTEGER DEFAULT 0,
  currentChunkIndex INTEGER DEFAULT 0,
  sessionProgress REAL DEFAULT 0,
  learningObjectives JSONB DEFAULT '[]',
  assessmentQuestions JSONB DEFAULT '[]'
);

-- Create course_files table
CREATE TABLE course_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courseId TEXT REFERENCES courses(id) ON DELETE CASCADE,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER,
  uri TEXT,
  uploadedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES auth.users(id) NOT NULL,
  courseId TEXT REFERENCES courses(id) ON DELETE CASCADE,
  sessionId TEXT REFERENCES study_sessions(id) ON DELETE CASCADE,
  progress REAL DEFAULT 0,
  completedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own courses" ON courses FOR SELECT USING (auth.uid() = userId);
CREATE POLICY "Users can create own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users can update own courses" ON courses FOR UPDATE USING (auth.uid() = userId);
CREATE POLICY "Users can delete own courses" ON courses FOR DELETE USING (auth.uid() = userId);

CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = study_sessions.courseId AND courses.userId = auth.uid())
);
CREATE POLICY "Users can create own study sessions" ON study_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = study_sessions.courseId AND courses.userId = auth.uid())
);
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = study_sessions.courseId AND courses.userId = auth.uid())
);
CREATE POLICY "Users can delete own study sessions" ON study_sessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = study_sessions.courseId AND courses.userId = auth.uid())
);

CREATE POLICY "Users can view own course files" ON course_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_files.courseId AND courses.userId = auth.uid())
);
CREATE POLICY "Users can create own course files" ON course_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_files.courseId AND courses.userId = auth.uid())
);
CREATE POLICY "Users can delete own course files" ON course_files FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_files.courseId AND courses.userId = auth.uid())
);

CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = userId);
CREATE POLICY "Users can create own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = userId);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = userId);
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = userId);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## **Step 6: Test Your Setup**

1. Start your app: `npm start`
2. Try creating an account
3. Check Supabase dashboard to see if data appears

## **🎉 You're Done!**

Your Smart Study Scheduler now has a completely free backend with:
- ✅ **User Authentication**
- ✅ **Database Storage**
- ✅ **Real-time Updates**
- ✅ **File Storage** (for course materials)
- ✅ **Row Level Security** (users only see their own data)

## **Free Tier Limits**

- **50,000 monthly active users**
- **500MB database storage**
- **1GB file storage**
- **2GB bandwidth**

Perfect for development and small-scale production! 🚀








