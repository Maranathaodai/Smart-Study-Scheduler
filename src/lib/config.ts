// Configuration for the Smart Study Scheduler app

export const CONFIG = {
  // OpenRouter API Configuration
  OPENROUTER: {
    API_URL: 'https://openrouter.ai/api/v1',
    API_KEY: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
    // Free GPT-style models available on OpenRouter
    MODELS: {
      TEXT_ANALYSIS: 'google/gemma-2-9b-it:free',
      CONTENT_CHUNKING: 'google/gemma-2-9b-it:free',
      GENERAL: 'google/gemma-2-9b-it:free',
    },
    // Enable AI processing with GPT-style models
    ENABLE_OFFLINE_MODE: false,
    MAX_RETRY_ATTEMPTS: 2,
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
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];

  if (!CONFIG.OPENROUTER.API_KEY) {
    missingKeys.push('EXPO_PUBLIC_OPENROUTER_API_KEY');
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

// Helper function to get API key with fallback
export function getOpenRouterApiKey(): string {
  const apiKey = CONFIG.OPENROUTER.API_KEY;
  
  if (!apiKey) {
    console.warn('OpenRouter API key not found. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
    return '';
  }
  
  return apiKey;
}
