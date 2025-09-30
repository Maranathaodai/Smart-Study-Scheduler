#!/bin/bash
# Script to set up Vercel environment variables
# Run this script to configure your API keys for deployment

echo "🔧 Setting up Vercel Environment Variables..."

# OpenRouter API Key
echo "Setting OpenRouter API Key..."
vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY production "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"
vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY preview "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"
vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY development "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"

# Supabase URL
echo "Setting Supabase URL..."
vercel env add EXPO_PUBLIC_SUPABASE_URL production "https://hyhbmpzpenooaedfqofm.supabase.co"
vercel env add EXPO_PUBLIC_SUPABASE_URL preview "https://hyhbmpzpenooaedfqofm.supabase.co"
vercel env add EXPO_PUBLIC_SUPABASE_URL development "https://hyhbmpzpenooaedfqofm.supabase.co"

# Supabase Anon Key
echo "Setting Supabase Anon Key..."
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU"
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY preview "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU"
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY development "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGJtcHpwZW5vb2FlZGZxb2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTcyOTYsImV4cCI6MjA3NDQzMzI5Nn0.zp71pzhZcodiBVtq6AnFtI5FMTa6GWGdehbw3f3sOYU"

echo "✅ Environment variables set up!"
echo "🚀 Now run: vercel --prod"