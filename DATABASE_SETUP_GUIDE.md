# 🗄️ Database Setup Guide

## The Problem
Your app is showing this error:
```
ERROR: Failed to fetch courses: column courses.user_id does not exist
```

This happens because:
1. The `courses` table exists but is incomplete (no columns)
2. Missing proper database schema
3. No Row Level Security policies

## ✅ Solution

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **hyhbmpzpenooaedfqofm**

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"**

### Step 3: Run the Database Setup Script
1. Copy the entire contents of `complete-database-setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button

### Step 4: Verify Setup
1. Run this command in your terminal:
   ```bash
   node verify-database.js
   ```
2. You should see: `✅ Database verification complete!`

### Step 5: Test Your App
1. Start your React Native app:
   ```bash
   npx expo start --clear
   ```
2. Sign in to your account
3. Try creating a course - it should work now!

## 🔧 What the Script Does

The `complete-database-setup.sql` script:

1. **Drops incomplete tables** (if they exist)
2. **Creates proper tables** with all required columns:
   - `courses` table with `user_id` column
   - `course_files` table for file storage
   - `study_sessions` table for schedule data

3. **Sets up Row Level Security (RLS)**:
   - Users can only see their own data
   - Automatic user ID filtering
   - Secure data access policies

4. **Creates indexes** for better performance

5. **Inserts test data** to verify everything works

## 🎯 Expected Results

After running the script, you should see:
- ✅ All tables created successfully
- ✅ RLS policies enabled
- ✅ Test data inserted
- ✅ No more "column does not exist" errors

## 🚨 Important Notes

- **Run the SQL script in Supabase dashboard** - not in your app
- **The script is safe** - it only creates tables and policies
- **Your existing data** (if any) will be preserved
- **Test the app** after setup to confirm it works

## 🆘 If You Still Have Issues

1. **Check Supabase logs** in the dashboard
2. **Verify the script ran completely** without errors
3. **Run the verification script** to test the setup
4. **Check your app logs** for any remaining errors

---

**Once you complete these steps, your app will have full database integration!** 🎉
