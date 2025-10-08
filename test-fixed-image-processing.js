const axios = require('axios');
require('dotenv').config();

// Test the fixed image processing with various scenarios
async function testFixedImageProcessing() {
  try {
    console.log('🧪 Testing FIXED Image Processing with Various Scenarios...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Test scenarios
    const testScenarios = [
      {
        name: 'Non-Educational Image (Person with Phone)',
        expectedResponse: 'NO_EDUCATIONAL_CONTENT_DETECTED',
        testDescription: 'Image of person using mobile device - should be rejected'
      },
      {
        name: 'Educational Diagram',
        expectedResponse: 'Valid educational content',
        testDescription: 'Diagram with educational content - should be processed'
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      console.log(`📝 Expected: ${scenario.expectedResponse}`);
      console.log(`🎯 Goal: ${scenario.testDescription}`);
      
      try {
        // Simulate the new system prompt for non-educational content
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'anthropic/claude-3-haiku:beta',
            messages: [
              {
                role: 'system',
                content: `You are an expert at analyzing educational images and extracting structured learning content.

ONLY process images that contain educational content such as:
- Diagrams, charts, graphs, flowcharts
- Educational text, formulas, equations  
- Study materials, textbooks, presentations
- Technical drawings, maps, scientific illustrations

If the image does NOT contain educational content (photos of people, landscapes, random objects, etc.), respond EXACTLY with:
"NO_EDUCATIONAL_CONTENT_DETECTED"

If educational content IS found, extract and format it as structured study material with headers and bullets.`
              },
              {
                role: 'user',
                content: scenario.name === 'Non-Educational Image (Person with Phone)' 
                  ? `Analyze this image: A photo showing a young man sitting at a desk, focused on using a mobile device. No visible educational content, charts, or study materials.`
                  : `Analyze this image: A flowchart showing the software development lifecycle with boxes for Planning, Analysis, Design, Implementation, Testing, and Maintenance connected by arrows.`
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
        
        console.log(`📥 AI Response: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`);
        
        // Test the enhanced isInstructionResponse detection
        const nonEducationalIndicators = [
          'no_educational_content_detected',
          'does not appear to contain any educational content',
          'no visible text, charts, or other educational elements',
          'this image shows',
          'there are no educational',
          'no educational content',
          'not educational',
          'no diagrams',
          'no charts visible',
          'no text visible'
        ];
        
        const lowercaseResult = result.toLowerCase();
        const isDetectedAsNonEducational = nonEducationalIndicators.some(indicator => 
          lowercaseResult.includes(indicator)
        );
        
        if (scenario.name.includes('Non-Educational')) {
          if (isDetectedAsNonEducational) {
            console.log('✅ SUCCESS: Non-educational content properly detected and rejected');
          } else {
            console.log('❌ FAILURE: Non-educational content not detected, could lead to hallucination');
          }
        } else {
          if (!isDetectedAsNonEducational && result.includes('#')) {
            console.log('✅ SUCCESS: Educational content properly processed');
          } else {
            console.log('⚠️ WARNING: Educational content may have been rejected');
          }
        }
        
      } catch (error) {
        console.log(`❌ Test failed for ${scenario.name}:`, error.response?.data?.error?.message || error.message);
      }
    }
    
    // Test the updated isInstructionResponse method
    console.log('\n🔬 Testing Enhanced isInstructionResponse Detection:');
    
    const testResponses = [
      {
        text: 'NO_EDUCATIONAL_CONTENT_DETECTED',
        shouldBeDetected: true,
        type: 'Non-educational detection response'
      },
      {
        text: 'This image does not appear to contain any educational content or diagrams.',
        shouldBeDetected: true,
        type: 'Descriptive non-educational response'
      },
      {
        text: '# Software Development Lifecycle\n\n## Planning Phase\n- Define requirements\n- Set objectives',
        shouldBeDetected: false,
        type: 'Valid educational content'
      },
      {
        text: 'Please provide me with the content to analyze.',
        shouldBeDetected: true,
        type: 'Instruction request'
      }
    ];
    
    testResponses.forEach((test, index) => {
      // Simulate the enhanced isInstructionResponse logic
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
      
      const nonEducationalIndicators = [
        'no_educational_content_detected',
        'does not appear to contain any educational content',
        'no visible text, charts, or other educational elements',
        'this image shows',
        'there are no educational',
        'no educational content',
        'not educational',
        'no diagrams',
        'no charts visible',
        'no text visible',
        'cannot identify educational content',
        'image does not contain',
        'no study material found'
      ];
      
      const lowercaseContent = test.text.toLowerCase();
      const hasInstructionIndicators = instructionIndicators.some(indicator => 
        lowercaseContent.includes(indicator)
      );
      const hasNonEducationalIndicators = nonEducationalIndicators.some(indicator => 
        lowercaseContent.includes(indicator)
      );
      const isDetected = hasInstructionIndicators || hasNonEducationalIndicators;
      
      console.log(`\n${index + 1}. ${test.type}:`);
      console.log(`   Text: "${test.text.substring(0, 60)}${test.text.length > 60 ? '...' : ''}"`);
      console.log(`   Expected detection: ${test.shouldBeDetected}`);
      console.log(`   Actual detection: ${isDetected}`);
      console.log(`   Result: ${isDetected === test.shouldBeDetected ? '✅ CORRECT' : '❌ INCORRECT'}`);
    });
    
    console.log('\n🎉 Image processing fix testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedImageProcessing();