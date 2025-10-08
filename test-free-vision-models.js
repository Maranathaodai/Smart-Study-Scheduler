const axios = require('axios');

// Test script to find free vision models that can handle PDF base64 content
async function testFreeVisionModels() {
  console.log('🔍 Testing free OpenRouter models for PDF base64 processing...\n');
  
  const API_KEY = 'YOUR_API_KEY_HERE';
  
  // Known free models that might have vision capabilities
  const modelsToTest = [
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free', 
    'microsoft/phi-3-mini-128k-instruct:free',
    'huggingface/starchat2-15b-v0.1:free',
    'openchat/openchat-7b:free',
    'nousresearch/nous-capybara-7b:free',
    'gryphe/mythomist-7b:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    // Potentially free vision models
    'google/gemini-flash-1.5:free',
    'anthropic/claude-3-haiku:free', 
    'meta-llama/llama-3.2-11b-vision:free',
    'meta-llama/llama-3.2-90b-vision:free',
    'microsoft/phi-3-vision-128k-instruct:free',
    'qwen/qwen-vl-chat:free',
    'vikhyatk/moondream2:free'
  ];

  // Simple test image in base64 (a small red square)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // Simple test "PDF" content (we'll simulate with text)
  const testPDFPrompt = `Extract and analyze the educational content from this document. The content is about "Introduction to Machine Learning" and should include key concepts, definitions, and learning objectives.

Please structure your response as educational content with:
- Clear section headers
- Key definitions
- Important concepts
- Learning objectives

Content to process: "Machine learning is a subset of artificial intelligence (AI) that focuses on the development of computer programs that can access data and use it to learn for themselves. The goal is to enable computers to learn automatically without human intervention or assistance."`;

  console.log('📋 Testing models with educational content processing...\n');

  for (const model of modelsToTest) {
    try {
      console.log(`🧪 Testing model: ${model}`);
      
      // Test 1: Basic text processing
      const textResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content processor. Create structured study material.'
          },
          {
            role: 'user', 
            content: testPDFPrompt
          }
        ],
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (textResponse.data && textResponse.data.choices && textResponse.data.choices[0]) {
        const content = textResponse.data.choices[0].message.content;
        const hasGoodStructure = content.includes('#') || content.includes('##') || content.includes('**');
        const hasEducationalContent = content.toLowerCase().includes('machine learning') && content.length > 200;
        
        console.log(`  ✅ Text processing: ${hasEducationalContent ? 'Good' : 'Basic'} (${content.length} chars)`);
        console.log(`  📝 Structure quality: ${hasGoodStructure ? 'Good' : 'Basic'}`);
        
        if (hasEducationalContent && hasGoodStructure) {
          console.log(`  🎯 PROMISING: ${model} - Good for educational content!`);
        }
      }
      
      // Test 2: Vision capability (if model supports it)
      try {
        const visionResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
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
                    url: `data:image/png;base64,${testImageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 200
        }, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (visionResponse.data && visionResponse.data.choices) {
          console.log(`  👁️ Vision support: YES - Can process images!`);
        }
      } catch (visionError) {
        console.log(`  👁️ Vision support: NO`);
      }

    } catch (error) {
      if (error.response?.status === 402) {
        console.log(`  💰 Model not free: ${model}`);
      } else if (error.response?.status === 404) {
        console.log(`  ❌ Model not found: ${model}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('\n🎯 Summary: Looking for models with both good educational content processing AND vision support...');
}

// Run the test
testFreeVisionModels().catch(console.error);
