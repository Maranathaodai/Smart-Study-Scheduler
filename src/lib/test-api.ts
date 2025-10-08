// Test script to verify OpenRouter API connection
import { openRouterClient } from './openrouter';

export async function testOpenRouterAPI() {
  try {
    console.log('🧪 Testing OpenRouter API connection...');
    
    // Test with a simple question
    const response = await openRouterClient.makeRequest({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life?'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    console.log('✅ API Connection Successful!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);
    
    return true;
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
    return false;
  }
}

// Test content analysis functionality
export async function testContentAnalysis() {
  try {
    console.log('🧪 Testing content analysis...');
    
    const sampleContent = `
    Machine Learning is a subset of artificial intelligence that focuses on algorithms 
    that can learn from data. There are three main types: supervised learning, 
    unsupervised learning, and reinforcement learning. Supervised learning uses 
    labeled data to train models, while unsupervised learning finds patterns in 
    unlabeled data. Reinforcement learning learns through interaction with an environment.
    `;

    const analysis = await openRouterClient.analyzeTextContent(sampleContent, 'concepts');
    console.log('✅ Content Analysis Successful!');
    console.log('Analysis Result:', analysis);
    
    return true;
  } catch (error) {
    console.error('❌ Content Analysis Failed:', error);
    return false;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting OpenRouter API Tests...\n');
  
  const apiTest = await testOpenRouterAPI();
  console.log('\n');
  const analysisTest = await testContentAnalysis();
  
  console.log('\n📊 Test Results:');
  console.log('API Connection:', apiTest ? '✅ PASS' : '❌ FAIL');
  console.log('Content Analysis:', analysisTest ? '✅ PASS' : '❌ FAIL');
  
  if (apiTest && analysisTest) {
    console.log('\n🎉 All tests passed! AI integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the error messages above.');
  }
  
  return { apiTest, analysisTest };
}
