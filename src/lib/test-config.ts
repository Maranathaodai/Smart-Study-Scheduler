// Test script to verify environment variables are working
// Run this with: node src/lib/test-config.js

require('dotenv').config();

console.log('🔍 Testing Environment Variable Configuration...\n');

// Test 1: Check if environment variables are loaded
console.log('📋 Environment Variables:');
console.log('- EXPO_PUBLIC_OPENROUTER_API_KEY:', process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

// Test 2: Check API key value (partial)
const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
if (apiKey) {
  console.log('\n🔑 API Key Status:');
  console.log('✅ OpenRouter API key found');
  console.log(`   - Length: ${apiKey.length} characters`);
  console.log(`   - Preview: ${apiKey.substring(0, 15)}...`);
  
  if (apiKey.includes('your_api_key_here')) {
    console.log('⚠️  WARNING: You still have the placeholder API key!');
    console.log('   Please replace it with your actual OpenRouter API key.');
  } else {
    console.log('✅ API key appears to be set correctly');
  }
} else {
  console.log('\n❌ OpenRouter API key not found');
}

// Test 3: Configuration check
console.log('\n⚙️ Next Steps:');
if (!apiKey || apiKey.includes('your_api_key_here')) {
  console.log('1. Go to https://openrouter.ai/ and get your API key');
  console.log('2. Replace "sk-or-v1-your_api_key_here" in the .env file with your actual key');
  console.log('3. Restart your development server');
} else {
  console.log('✅ Configuration looks good! You can now use the AI features.');
}

console.log('\n🎉 Configuration test complete!');