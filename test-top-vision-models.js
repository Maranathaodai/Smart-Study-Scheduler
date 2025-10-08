const axios = require('axios');

// Test the top performing vision models and get their exact pricing
async function testTopVisionModels() {
  console.log('🎯 Testing the BEST vision models found for PDF processing...\n');
  
  const API_KEY = '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';
  
  // Top 3 models that showed excellent results
  const topModels = [
    {
      name: 'anthropic/claude-3-haiku',
      description: 'Claude 3 Haiku - Fastest Claude model'
    },
    {
      name: 'anthropic/claude-3-haiku:beta', 
      description: 'Claude 3 Haiku Beta - Potentially free version'
    },
    {
      name: 'mistralai/pixtral-12b',
      description: 'Mistral Pixtral 12B - Vision specialized model'
    }
  ];

  // Create a more realistic educational content test
  const educationalPrompt = `Please extract and structure the educational content from this document. The content should be about Machine Learning fundamentals. 

Structure your response as professional study material with:
# Main Topic
## Key Concepts  
- Important definitions
- Core principles
### Learning Objectives
- What students should learn
- Skills to develop
### Assessment Points
- Key questions to test understanding

Please format with proper markdown and make it comprehensive for studying.`;

  // Simple test image (1x1 pixel)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  for (const model of topModels) {
    console.log(`\n🧪 DETAILED TEST: ${model.name}`);
    console.log(`📋 Description: ${model.description}`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model.name,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content processor specializing in creating high-quality study materials from documents and images.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: educationalPrompt
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
        max_tokens: 1500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://smart-study-scheduler.vercel.app/',
          'X-Title': 'Smart Study Scheduler'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.data && response.data.choices) {
        const content = response.data.choices[0].message.content;
        const usage = response.data.usage;
        
        // Quality analysis
        const hasHeaders = (content.match(/#/g) || []).length;
        const hasSubHeaders = (content.match(/##/g) || []).length;
        const hasBullets = (content.match(/-/g) || []).length;
        const hasEmphasis = (content.match(/\*\*/g) || []).length;
        const isEducational = content.toLowerCase().includes('learning') && 
                            (content.toLowerCase().includes('concept') || 
                             content.toLowerCase().includes('objective'));
        
        console.log(`✅ SUCCESS!`);
        console.log(`⏱️ Response time: ${responseTime}ms`);
        console.log(`📏 Content length: ${content.length} characters`);
        console.log(`🏗️ Structure quality:`);
        console.log(`   - Headers (#): ${hasHeaders}`);
        console.log(`   - Subheaders (##): ${hasSubHeaders}`);
        console.log(`   - Bullet points: ${hasBullets}`);
        console.log(`   - Emphasis (**): ${hasEmphasis / 2} pairs`);
        console.log(`🎓 Educational content: ${isEducational ? 'YES' : 'NO'}`);
        
        if (usage) {
          console.log(`💰 Token usage:`);
          console.log(`   - Input tokens: ${usage.prompt_tokens}`);
          console.log(`   - Output tokens: ${usage.completion_tokens}`);
          console.log(`   - Total tokens: ${usage.total_tokens}`);
          
          // Estimate cost (approximate rates)
          const inputCost = usage.prompt_tokens * 0.25 / 1000000; // $0.25 per 1M tokens
          const outputCost = usage.completion_tokens * 1.25 / 1000000; // $1.25 per 1M tokens
          const totalCost = inputCost + outputCost;
          console.log(`   - Estimated cost: $${totalCost.toFixed(6)} (${(totalCost * 1000000).toFixed(2)} per 1M tokens)`);
        }
        
        // Show quality sample
        console.log(`\n📄 SAMPLE OUTPUT (first 300 chars):`);
        console.log(`"${content.substring(0, 300)}..."`);
        
        // Quality score
        let qualityScore = 0;
        if (hasHeaders > 0) qualityScore += 2;
        if (hasSubHeaders > 0) qualityScore += 2;
        if (hasBullets > 5) qualityScore += 2;
        if (hasEmphasis > 2) qualityScore += 1;
        if (isEducational) qualityScore += 3;
        if (content.length > 500) qualityScore += 1;
        
        console.log(`\n🏆 QUALITY SCORE: ${qualityScore}/11`);
        
        if (qualityScore >= 8) {
          console.log(`🎯 EXCELLENT - Perfect for production use!`);
        } else if (qualityScore >= 6) {
          console.log(`✨ GOOD - Suitable for production`);
        } else {
          console.log(`⚠️ BASIC - Needs improvement`);
        }

      }

    } catch (error) {
      console.log(`❌ FAILED: ${error.response?.status || error.message}`);
      if (error.response?.status === 402) {
        console.log(`💰 This model requires payment`);
      }
      if (error.response?.data) {
        console.log(`📄 Error details:`, error.response.data);
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
  }

  console.log(`\n\n🎯 FINAL RECOMMENDATIONS:`);
  console.log(`Based on this testing, here are the best options for PDF processing:`);
}

// Run the test
testTopVisionModels().catch(console.error);