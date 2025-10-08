const axios = require('axios');
require('dotenv').config();

// Test the fixed PDF processing
async function testFixedPDFProcessing() {
  try {
    console.log('🔧 Testing FIXED PDF Processing...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Test content
    const testContent = `# Introduction to Machine Learning

## What is Machine Learning?
Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data.

## Types of Machine Learning
1. Supervised Learning - uses labeled examples
2. Unsupervised Learning - finds hidden patterns
3. Reinforcement Learning - learns through rewards

## Key Concepts
- Algorithms: The rules or instructions given to AI
- Training Data: Information used to teach the machine
- Model: The output of algorithms after training
- Prediction: The output or result from the model`;

    // Convert to base64 (simulating PDF upload)
    const base64Content = Buffer.from(testContent).toString('base64');
    
    console.log('📤 Input content:', testContent.substring(0, 100) + '...');
    console.log('📤 Base64 length:', base64Content.length);
    
    // Test the same approach as our fixed implementation
    let textContent;
    try {
      textContent = Buffer.from(base64Content, 'base64').toString('utf-8');
      console.log('✅ Successfully decoded base64 to text');
    } catch (decodeError) {
      console.log('❌ Could not decode base64');
      return;
    }
    
    console.log('\n🤖 Processing with Claude Haiku...');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating structured educational content. Transform the provided content into high-quality study material.

Create professional study material with:
- Clear headers and structure
- Well-formatted markdown
- Key points as bullet lists
- Important concepts with emphasis
- Learning objectives when appropriate

Return ONLY the structured educational content, no explanations.`
          },
          {
            role: 'user',
            content: `Transform this content into structured study material:\n\n${textContent}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
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
    
    console.log('\n📥 FIXED PROCESSING RESULT:');
    console.log('='.repeat(60));
    console.log(result);
    console.log('='.repeat(60));
    
    // Verify the result
    const inputTopics = ['Machine Learning', 'Supervised Learning', 'Unsupervised Learning'];
    const preservedTopics = inputTopics.filter(topic => 
      result.toLowerCase().includes(topic.toLowerCase())
    );
    
    console.log('\n✅ VERIFICATION:');
    console.log(`📋 Input topics preserved: ${preservedTopics.length}/${inputTopics.length}`);
    console.log(`📝 Has proper headers: ${result.includes('#') ? 'Yes' : 'No'}`);
    console.log(`🎯 Has structure: ${result.includes('##') ? 'Yes' : 'No'}`);
    console.log(`📋 Has lists: ${result.includes('-') || result.includes('1.') ? 'Yes' : 'No'}`);
    
    if (preservedTopics.length === inputTopics.length) {
      console.log('\n🎉 SUCCESS: Content properly processed and preserved!');
    } else {
      console.log('\n⚠️ WARNING: Some content may have been lost or changed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFixedPDFProcessing();