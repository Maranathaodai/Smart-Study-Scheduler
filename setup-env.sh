#!/bin/bash
# Script to set up environment variables for Smart Study Scheduler

echo "🔧 Setting up environment variables for Smart Study Scheduler..."

# Create .env file
cat > .env << EOF
# Smart Study Scheduler Environment Variables
EXPO_PUBLIC_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

# Supabase Configuration (already configured in supabase.ts)
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF

echo "✅ Environment variables set successfully!"
echo "📋 Created .env file with OpenRouter API key"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server: npx expo start --clear"
echo "2. Test the configuration: node src/lib/test-config.ts"
echo ""
echo "🎉 Your app should now be able to process PDF files with AI!"
