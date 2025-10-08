const axios = require('axios');
require('dotenv').config();

// Quick test to see what Claude is actually returning
async function debugClaudeOutput() {
  try {
    console.log('🔍 Debugging Claude Output...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }

    // Simple test without vision
    console.log('📝 Testing simple text extraction...');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: 'Extract and format the following content as study material. Return ONLY the formatted content.'
          },
          {
            role: 'user',
            content: 'Format this as study material: "Introduction to Machine Learning. ML is AI subset. Types: supervised, unsupervised, reinforcement."'
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smart-study-scheduler.vercel.app/',
          'X-Title': 'Smart Study Scheduler'
        }
      }
    );

    const result = response.data.choices[0].message.content;
    
    console.log('\n📄 ACTUAL OUTPUT:');
    console.log('='.repeat(50));
    console.log(result);
    console.log('='.repeat(50));
    
    // Check if it's returning system prompt
    if (result.includes('EXTRACTION REQUIREMENTS') || result.includes('OUTPUT FORMAT')) {
      console.log('❌ PROBLEM: Model is returning system prompt instead of content!');
    } else {
      console.log('✅ SUCCESS: Model is returning actual formatted content');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugClaudeOutput();