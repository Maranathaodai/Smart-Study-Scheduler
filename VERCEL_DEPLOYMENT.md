# 🚀 Vercel Deployment Guide with Environment Variables

## Important: Your AI Features Need API Keys!

Your Smart Study Scheduler app requires the OpenRouter API key to generate AI-powered study chunks and content processing. Here's how to deploy while keeping your API keys secure.

## Step 1: Deploy to Vercel

### Option A: Deploy via GitHub Integration (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select your `Smart-Study-Scheduler` repository
5. Vercel will auto-detect it as a static site

### Option B: Deploy via CLI
```bash
# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: smart-study-scheduler
# - Directory: ./
# - Want to override settings? No
```

## Step 2: Configure Environment Variables in Vercel

**CRITICAL**: Your app won't work without these environment variables!

### Via Vercel Dashboard:
1. Go to your project in [vercel.com](https://vercel.com)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | `sk-or-v1-your_actual_api_key_here` | Production, Preview, Development |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://hyhbmpzpenooaedfqofm.supabase.co` | Production, Preview, Development |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

### Via Vercel CLI:
```bash
# Set OpenRouter API Key
vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY

# Set Supabase URL
vercel env add EXPO_PUBLIC_SUPABASE_URL

# Set Supabase Anon Key  
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Step 3: Redeploy After Setting Environment Variables

After adding environment variables, trigger a new deployment:

### Via Dashboard:
1. Go to **Deployments** tab
2. Click the three dots on latest deployment
3. Click **Redeploy**

### Via CLI:
```bash
vercel --prod
```

## Step 4: Test Your Deployment

1. **Visit your deployed app**
2. **Check AI features work:**
   - Try adding a course
   - Upload study material
   - Verify AI chunking works
3. **Check browser console** for any environment variable errors

## Environment Variables You Need:

### OpenRouter API Key
- **Purpose**: Powers AI content processing and study chunk generation
- **Where to get**: [OpenRouter.ai](https://openrouter.ai/) (free tier available)
- **Format**: `sk-or-v1-[your-key-here]`

### Supabase Configuration
- **Purpose**: User authentication and data storage
- **Already configured in your project**

## Troubleshooting

### App Deployed But AI Features Don't Work?
1. **Check environment variables** in Vercel dashboard
2. **Verify API key** is correct and has credits
3. **Redeploy** after adding env vars
4. **Check browser console** for API errors

### Build Fails?
1. **Check build logs** in Vercel dashboard
2. **Verify dependencies** are properly installed
3. **Test local build**: `npm run build:web`

### Environment Variables Not Loading?
1. **Use EXPO_PUBLIC_ prefix** for client-side variables
2. **Set for all environments** (Production, Preview, Development)
3. **Redeploy** after changes

## Your Deployment URLs

After deployment, you'll get:
- **Production**: `https://smart-study-scheduler-[hash].vercel.app`
- **Custom Domain**: Set up in Vercel dashboard if desired

## Security Notes

✅ **Good Practices:**
- API keys are set in Vercel dashboard (secure)
- .env file is not committed to git
- Environment variables are encrypted in Vercel

❌ **Never Do:**
- Commit API keys to GitHub
- Share API keys publicly
- Use production keys in development

## Quick Commands Reference

```bash
# Deploy
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View project settings
vercel env ls

# Add environment variable
vercel env add [VARIABLE_NAME]
```

---

**🎉 Once deployed with environment variables, your Smart Study Scheduler will have full AI-powered features in production!**