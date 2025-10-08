const axios = require('axios');
require('dotenv').config();

// Test what happens when AI processes non-educational images
async function testNonEducationalImageProcessing() {
  try {
    console.log('🔍 Testing Non-Educational Image Processing...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Simulate what the AI would return for a non-educational image
    // (since we can't actually send a real image, let's test the response handling)
    const mockNonEducationalResponse = `This image does not appear to contain any educational content or diagrams. It shows a young man sitting at a desk, focused on using a mobile device. There are no visible text, charts, or other educational elements in the image. As per the instructions, I will not identify or name the person in the image.`;
    
    console.log('📥 Mock AI Response for Non-Educational Image:');
    console.log('='.repeat(60));
    console.log(mockNonEducationalResponse);
    console.log('='.repeat(60));
    
    // Test current isInstructionResponse logic
    const instructionIndicators = [
      'please provide me with',
      'please provide the',
      'please copy and paste',
      'please upload',
      'i need you to',
      'i can help you',
      'i\'m ready to',
      'waiting for you to provide',
      'send me the content',
      'share the content',
      'provide the text',
      'paste the content here'
    ];
    
    const lowercaseContent = mockNonEducationalResponse.toLowerCase();
    const isCurrentlyDetected = instructionIndicators.some(indicator => 
      lowercaseContent.includes(indicator)
    );
    
    console.log('\n🔍 CURRENT DETECTION:');
    console.log(`❌ Detected as instruction response: ${isCurrentlyDetected}`);
    
    // Test what we should detect
    const nonEducationalIndicators = [
      'does not appear to contain any educational content',
      'no visible text, charts, or other educational elements',
      'this image shows',
      'there are no educational',
      'no educational content',
      'not educational',
      'no diagrams',
      'no charts',
      'no text visible'
    ];
    
    const shouldBeDetected = nonEducationalIndicators.some(indicator => 
      lowercaseContent.includes(indicator)
    );
    
    console.log(`✅ Should be detected as non-educational: ${shouldBeDetected}`);
    
    if (!isCurrentlyDetected && shouldBeDetected) {
      console.log('\n🚨 PROBLEM CONFIRMED:');
      console.log('- AI correctly identifies non-educational content');
      console.log('- But system doesn\'t detect this as problematic response');
      console.log('- System might proceed to generate random content');
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('- Update isInstructionResponse to catch non-educational responses');
      console.log('- Add proper error handling for non-educational images');
    }
    
    // Now test what happens if AI hallucinates content
    console.log('\n🔬 Testing Hallucination Scenario...');
    
    const hallucinatedResponse = `# React Native Basics

## Introduction  
React Native allows you to build mobile applications using React...

### Key Features
- Cross-platform development
- Native performance`;
    
    console.log('📥 Hypothetical Hallucinated Response:');
    console.log(hallucinatedResponse.substring(0, 200) + '...');
    
    const isHallucinationDetected = instructionIndicators.some(indicator => 
      hallucinatedResponse.toLowerCase().includes(indicator)
    );
    
    console.log(`❌ Hallucination detected by current logic: ${isHallucinationDetected}`);
    console.log('🚨 This would pass through and create incorrect study material!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNonEducationalImageProcessing();