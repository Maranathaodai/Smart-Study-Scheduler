const axios = require('axios');

// Test script to find the best vision models for PDF processing (including paid)
async function testVisionModels() {
  console.log('🔍 Testing OpenRouter vision models for PDF processing...\n');
  
  const API_KEY = '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';
  
  // Known vision models (including paid ones)
  const visionModels = [
    // Free models that work well for text
    'google/gemma-2-9b-it:free',
    'mistralai/mistral-7b-instruct:free',
    
    // Potentially low-cost vision models
    'google/gemini-flash-1.5',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3-haiku:beta',
    'meta-llama/llama-3.2-11b-vision',
    'meta-llama/llama-3.2-90b-vision', 
    'microsoft/phi-3-vision-128k-instruct',
    'qwen/qwen2-vl-7b-instruct',
    'qwen/qwen2-vl-72b-instruct',
    'mistralai/pixtral-12b',
    'anthropic/claude-3-5-sonnet',
    'openai/gpt-4o-mini'
  ];

  // Create a simple test image that looks like a document page
  const createTestDocumentImage = () => {
    // This would be a base64 of a simple document-like image
    // For now, using a simple test pattern
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  };

  const testImageBase64 = createTestDocumentImage();
  
  console.log('📋 Testing vision models for document processing...\n');

  for (const model of visionModels) {
    try {
      console.log(`🧪 Testing model: ${model}`);
      
      // Test vision capability with document processing prompt
      const visionResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting and structuring educational content from documents. Create well-formatted study material with headers, key points, and learning objectives.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the educational content from this document image and structure it for studying. Include:
- Main topics and subtopics as headers
- Key concepts and definitions
- Important points as bullet lists
- Learning objectives

Format your response with markdown-style structure (# for headers, ## for subheaders, - for bullets, **bold** for emphasis).`
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
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (visionResponse.data && visionResponse.data.choices) {
        const content = visionResponse.data.choices[0].message.content;
        const usage = visionResponse.data.usage;
        
        // Check quality indicators
        const hasGoodStructure = content.includes('#') || content.includes('##') || content.includes('**');
        const hasEducationalStructure = content.toLowerCase().includes('learning') || 
                                       content.toLowerCase().includes('concept') ||
                                       content.toLowerCase().includes('objective');
        const isStructured = content.includes('-') || content.includes('1.') || content.includes('•');
        
        console.log(`  ✅ Vision support: YES`);
        console.log(`  📝 Response length: ${content.length} chars`);
        console.log(`  🏗️ Good structure: ${hasGoodStructure ? 'YES' : 'NO'}`);
        console.log(`  🎓 Educational format: ${hasEducationalStructure ? 'YES' : 'NO'}`);
        console.log(`  📋 Well organized: ${isStructured ? 'YES' : 'NO'}`);
        
        if (usage) {
          console.log(`  💰 Token usage: ${usage.prompt_tokens} input + ${usage.completion_tokens} output = ${usage.total_tokens} total`);
        }
        
        // Show sample of response
        console.log(`  📄 Sample response: "${content.substring(0, 150)}..."`);
        
        if (hasGoodStructure && hasEducationalStructure && isStructured) {
          console.log(`  🎯 EXCELLENT: ${model} - Perfect for educational document processing!`);
        } else if (hasGoodStructure && isStructured) {
          console.log(`  ✨ GOOD: ${model} - Good for document processing`);
        }
      }

    } catch (error) {
      if (error.response?.status === 402) {
        console.log(`  💰 Payment required: ${model}`);
      } else if (error.response?.status === 404) {
        console.log(`  ❌ Model not found: ${model}`);
      } else if (error.response?.status === 400) {
        // Might not support vision
        console.log(`  👁️ No vision support: ${model}`);
      } else {
        console.log(`  ❌ Error: ${error.response?.status || error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('\n🎯 Summary and Recommendations:');
  console.log('Looking for the best balance of cost, quality, and vision support for PDF processing...');
}

// Run the test
testVisionModels().catch(console.error);