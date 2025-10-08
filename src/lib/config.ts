// Configuration for the Smart Study Scheduler app

export const CONFIG = {
  // OpenRouter API Configuration
  OPENROUTER: {
    API_URL: 'https://openrouter.ai/api/v1',
    API_KEY: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
    // Working free models available on OpenRouter
    MODELS: {
      TEXT_ANALYSIS: 'google/gemma-2-9b-it:free', // Working model
      CONTENT_CHUNKING: 'google/gemma-2-9b-it:free', // Use working model instead of mistral
      GENERAL: 'google/gemma-2-9b-it:free', // Working model
      PDF_PROCESSING: 'anthropic/claude-3-haiku:beta', // Excellent vision model (potentially free)
      PDF_PROCESSING_FALLBACK: 'anthropic/claude-3-haiku', // Excellent vision model (low cost)
      IMAGE_ANALYSIS: 'anthropic/claude-3-haiku:beta', // Excellent vision model
      VISION_PROCESSING: 'mistralai/pixtral-12b', // Most comprehensive vision model
    },
    // Enable AI processing with GPT-style models
    ENABLE_OFFLINE_MODE: false,
    MAX_RETRY_ATTEMPTS: 2,
  },

  // Supabase Configuration
  SUPABASE: {
    URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Content Processing Configuration
  CONTENT_PROCESSING: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md'],
    DEFAULT_CHUNK_SIZE: 15, // minutes
    MAX_CHUNKS_PER_SESSION: 5,
  },

  // Study Session Configuration
  STUDY_SESSION: {
    DEFAULT_MAX_TIME_PER_SESSION: 60, // minutes
    MIN_CHUNK_TIME: 5, // minutes
    MAX_CHUNK_TIME: 45, // minutes
    BREAK_INTERVAL: 25, // minutes (Pomodoro technique)
  },

  // UI Configuration
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    MAX_RETRY_ATTEMPTS: 3,
  },
};

// Validation function to check if required configuration is present
export function validateConfig(): { isValid: boolean; missingKeys: string[]; warnings: string[] } {
  const missingKeys: string[] = [];
  const warnings: string[] = [];

  // Check OpenRouter API Key
  if (!CONFIG.OPENROUTER.API_KEY) {
    missingKeys.push('EXPO_PUBLIC_OPENROUTER_API_KEY');
  } else if (CONFIG.OPENROUTER.API_KEY.includes('your_api_key_here')) {
    warnings.push('OpenRouter API key is still set to placeholder value. Please update with your actual API key from https://openrouter.ai/');
  }

  // Check Supabase configuration
  if (!CONFIG.SUPABASE.URL) {
    missingKeys.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!CONFIG.SUPABASE.ANON_KEY) {
    missingKeys.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    warnings,
  };
}

// Helper function to get API key with fallback
export function getOpenRouterApiKey(): string {
  const apiKey = CONFIG.OPENROUTER.API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OpenRouter API key not found. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your .env file.');
    console.warn('💡 Get your API key from: https://openrouter.ai/');
    
    // For development/testing, return empty string to trigger fallback
    return '';
  }
  
  if (apiKey.includes('your_api_key_here')) {
    console.warn('⚠️ OpenRouter API key is still set to placeholder value.');
    console.warn('💡 Please replace it with your actual API key from https://openrouter.ai/');
    
    // For development/testing, return empty string to trigger fallback
    return '';
  }
  
  console.log('✅ OpenRouter API key loaded successfully');
  return apiKey;
}

// Helper function to get Supabase configuration
export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: CONFIG.SUPABASE.URL,
    anonKey: CONFIG.SUPABASE.ANON_KEY,
  };
}

// Development helper to print configuration status
export function printConfigStatus(): void {
  console.log('📋 Smart Study Scheduler Configuration Status:');
  
  const validation = validateConfig();
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ All configuration is valid and ready!');
  } else {
    if (validation.missingKeys.length > 0) {
      console.log('❌ Missing required environment variables:');
      validation.missingKeys.forEach(key => {
        console.log(`   - ${key}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️ Configuration warnings:');
      validation.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    console.log('\n📖 Setup instructions: Check ENV_SETUP.md for details');
  }
}
