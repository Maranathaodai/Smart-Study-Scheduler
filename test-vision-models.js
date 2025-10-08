const axios = require('axios');

// Free vision models that might support multimodal content
const POTENTIAL_FREE_VISION_MODELS = [
  // Google Gemini models (often free on OpenRouter)
  'google/gemini-flash-1.5',
  'google/gemini-pro-vision',
  'google/gemini-flash-1.5-8b',
  
  // Meta Llava models (vision-language models)
  'meta-llama/llava-v1.5-7b-4096-preview',
  'liuhaotian/llava-v1.6-mistral-7b',
  'liuhaotian/llava-v1.6-vicuna-7b',
  
  // Mistral Pixtral (vision model)
  'mistralai/pixtral-12b',
  'mistralai/pixtral-12b:free',
  
  // Qwen vision models 
  'qwen/qwen-vl-chat',
  'qwen/qwen2-vl-7b-instruct',
  
  // Other potential free vision models
  'cognitivecomputations/dolphin-vision-72b',
  'xai-org/grok-vision-beta',
  'anthropic/claude-3-haiku:beta',
  
  // Known working models with potential vision support
  'google/gemma-2-27b-it:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'meta-llama/llama-3.2-90b-vision-instruct:free',
];

async function testVisionModels() {
  console.log('🔍 Testing free vision models for PDF/image processing...\n');
  
  const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || 'YOUR_API_KEY_HERE';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Simple base64 test content (a small image)
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  const workingModels = [];
  const failedModels = [];
  
  for (const model of POTENTIAL_FREE_VISION_MODELS) {
    try {
      console.log(`🧪 Testing model: ${model}`);
      
      const response = await axios.post(API_URL, {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe what you see in this image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${testBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data?.choices?.[0]?.message?.content) {
        const result = response.data.choices[0].message.content;
        console.log(`✅ ${model} - SUCCESS`);
        console.log(`   Response: ${result.substring(0, 100)}...`);
        workingModels.push({
          model,
          response: result,
          cost: response.data.usage || 'Unknown'
        });
      }
      
    } catch (error) {
      console.log(`❌ ${model} - FAILED: ${error.response?.data?.error?.message || error.message}`);
      failedModels.push({
        model,
        error: error.response?.data?.error?.message || error.message
      });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log(`✅ Working vision models: ${workingModels.length}`);
  console.log(`❌ Failed models: ${failedModels.length}`);
  
  if (workingModels.length > 0) {
    console.log('\n🎯 RECOMMENDED FREE VISION MODELS:');
    workingModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.model}`);
      console.log(`   Sample response: ${model.response.substring(0, 150)}...`);
      console.log(`   Usage: ${JSON.stringify(model.cost)}\n`);
    });
    
    console.log('🔧 To implement these models, update your config.ts:');
    console.log(`
// Best vision models for PDF/image processing
MODELS: {
  IMAGE_ANALYSIS: '${workingModels[0].model}',
  PDF_PROCESSING: '${workingModels[0].model}',
  TEXT_ANALYSIS: 'google/gemma-2-9b-it:free',
  CONTENT_CHUNKING: 'mistralai/mistral-7b-instruct:free',
}
    `);
  } else {
    console.log('\n⚠️ No free vision models found. Current approach with fallback is correct.');
  }
}

testVisionModels().catch(console.error);