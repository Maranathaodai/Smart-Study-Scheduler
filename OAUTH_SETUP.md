# OAuth Setup Guide for Smart Study Scheduler

This guide will help you configure Google and GitHub OAuth providers in Supabase for your Smart Study Scheduler app.

## Prerequisites

- Supabase project created
- Google Cloud Console account
- GitHub account

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `smart-study-scheduler://auth/callback` (for mobile)
5. Copy the Client ID and Client Secret

### Step 2: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Save the configuration

## 2. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Smart Study Scheduler
   - **Homepage URL**: `https://your-app-domain.com`
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### Step 2: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable GitHub provider
4. Enter your GitHub OAuth credentials:
   - **Client ID**: Your GitHub OAuth Client ID
   - **Client Secret**: Your GitHub OAuth Client Secret
5. Save the configuration

## 3. Mobile App Configuration

### For Expo/React Native

1. Update your `app.json` to include the OAuth redirect scheme:

```json
{
  "expo": {
    "scheme": "smart-study-scheduler",
    "web": {
      "bundler": "metro"
    }
  }
}
```

2. Install required dependencies:

```bash
npm install expo-web-browser expo-auth-session
```

### For Production

Make sure to update your redirect URLs in both Google and GitHub OAuth apps to include your production domain:

- Google: `https://your-production-domain.com/auth/callback`
- GitHub: `https://your-production-domain.com/auth/callback`

## 4. Testing OAuth

1. Start your app: `npm start`
2. Navigate to the login screen
3. Click "Continue with Google" or "Continue with GitHub"
4. Complete the OAuth flow
5. Verify that the user is logged in and redirected to the main app

## 5. Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that your redirect URIs match exactly in both Supabase and OAuth provider settings
   - Ensure the scheme in `app.json` matches the redirect URI

2. **"Client ID not found"**
   - Verify that the Client ID is correctly entered in Supabase
   - Check that the OAuth app is properly configured

3. **"Access denied"**
   - Ensure the OAuth app is not in development mode (for Google)
   - Check that the user has granted necessary permissions

### Debug Steps

1. Check Supabase logs in the dashboard
2. Verify OAuth provider settings
3. Test with different browsers/devices
4. Check network requests in browser dev tools

## 6. Security Considerations

- Keep your OAuth secrets secure
- Use environment variables for sensitive data
- Regularly rotate your OAuth secrets
- Monitor OAuth usage in your Supabase dashboard
- Implement proper error handling for OAuth failures

## 7. Additional Providers

You can add more OAuth providers by following similar steps:

- **Discord**: Enable Discord provider in Supabase
- **Twitter**: Enable Twitter provider in Supabase
- **Apple**: Enable Apple provider in Supabase

Each provider will have its own setup process, but the Supabase configuration remains similar.

---

## Quick Reference

### Supabase Dashboard URLs
- Authentication: `https://supabase.com/dashboard/project/[PROJECT_ID]/auth/providers`
- Settings: `https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api`

### OAuth Provider URLs
- Google: `https://console.cloud.google.com/apis/credentials`
- GitHub: `https://github.com/settings/developers`

Replace `[PROJECT_ID]` with your actual Supabase project ID.