const axios = require('axios');

// Test some newer potentially free models
const NEWER_MODELS = [
  // Meta's newer free models
  'meta-llama/llama-3.2-1b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free', 
  'meta-llama/llama-3.1-8b-instruct:free',
  
  // Google's free models
  'google/gemini-flash-1.5-exp',
  'google/gemma-2-9b-it:free',
  'google/gemma-2-2b-it:free',
  
  // Mistral free models
  'mistralai/mistral-7b-instruct:free',
  'mistralai/mixtral-8x7b-instruct:free',
  
  // Qwen free models
  'qwen/qwen-2.5-7b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  
  // Other potentially free models
  'microsoft/phi-3-medium-128k-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
];

async function testFreeModelsForText() {
  console.log('🔍 Testing truly FREE models for high-quality text processing...\n');
  
  const API_KEY = 'YOUR_API_KEY_HERE';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  const testContent = `# Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.

## Types of Machine Learning

### Supervised Learning
In supervised learning, the algorithm learns from labeled training data. The goal is to map inputs to the correct outputs based on example input-output pairs.

Key characteristics:
- Uses labeled datasets for training
- Predicts outcomes for new data
- Common examples: classification and regression`;

  const workingModels = [];
  
  for (const model of NEWER_MODELS) {
    try {
      console.log(`🧪 Testing ${model}...`);
      
      const response = await axios.post(API_URL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating educational study chunks. Transform content into well-structured, professional study material with markdown formatting, learning objectives, and clear organization.'
          },
          {
            role: 'user',
            content: `Transform this educational content into professional study chunks with learning objectives and proper markdown formatting:\n\n${testContent}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data?.choices?.[0]?.message?.content) {
        const result = response.data.choices[0].message.content;
        
        // Check quality indicators
        const hasMarkdown = result.includes('#') || result.includes('**') || result.includes('- ');
        const hasLearningObjectives = result.toLowerCase().includes('learning') || result.toLowerCase().includes('objective');
        const hasStructure = result.includes('##') || result.includes('###');
        const isWellFormatted = hasMarkdown && (hasLearningObjectives || hasStructure);
        
        console.log(`✅ ${model} - SUCCESS`);
        console.log(`   Quality: ${isWellFormatted ? 'HIGH' : 'BASIC'}`);
        console.log(`   Sample: ${result.substring(0, 150)}...`);
        console.log(`   Tokens: ${JSON.stringify(response.data.usage)}`);
        
        workingModels.push({
          model,
          quality: isWellFormatted ? 'HIGH' : 'BASIC',
          sample: result.substring(0, 200),
          usage: response.data.usage
        });
      }
      
    } catch (error) {
      console.log(`❌ ${model} - FAILED: ${error.response?.data?.error?.message || error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ Working free models: ${workingModels.length}`);
  
  if (workingModels.length > 0) {
    console.log('\n🎯 RECOMMENDED FREE MODELS FOR TEXT PROCESSING:');
    
    const highQualityModels = workingModels.filter(m => m.quality === 'HIGH');
    const basicModels = workingModels.filter(m => m.quality === 'BASIC');
    
    if (highQualityModels.length > 0) {
      console.log('\n⭐ HIGH QUALITY MODELS:');
      highQualityModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.model}`);
        console.log(`   Sample: ${model.sample}...`);
        console.log(`   Tokens: ${model.usage.total_tokens}\n`);
      });
    }
    
    if (basicModels.length > 0) {
      console.log('\n📝 BASIC QUALITY MODELS:');
      basicModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.model} (${model.usage.total_tokens} tokens)`);
      });
    }
    
    // Recommend the best
    const bestModel = highQualityModels.length > 0 ? highQualityModels[0] : workingModels[0];
    console.log(`\n🔧 RECOMMENDED CONFIG UPDATE:`);
    console.log(`
// Update your config.ts with the best free model:
MODELS: {
  TEXT_ANALYSIS: '${bestModel.model}',
  CONTENT_CHUNKING: '${bestModel.model}',
  PDF_PROCESSING: '${bestModel.model}', // For text extraction
  IMAGE_ANALYSIS: '${bestModel.model}', // For fallback text processing
}
    `);
  } else {
    console.log('\n⚠️ No working free models found. Stick with current models.');
  }
}

testFreeModelsForText().catch(console.error);
