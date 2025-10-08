const axios = require('axios');
require('dotenv').config();

// Test specifically what happens with PDF base64 processing
async function debugPDFProcessing() {
  try {
    console.log('🔍 DEBUGGING: PDF Base64 Processing...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Create a real PDF base64 string (simulated)
    const pdfContent = `# React Native Tutorial
    
## Introduction
React Native allows you to build mobile apps using React.

### Key Features
- Cross-platform development
- Native performance
- Hot reloading`;
    
    const base64Content = Buffer.from(pdfContent).toString('base64');
    
    console.log('📤 Testing PDF base64 processing...');
    console.log('Base64 length:', base64Content.length);
    
    // Test the exact same call that our app makes
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting and structuring educational content from PDF documents. Create high-quality study material with:

EXTRACTION REQUIREMENTS:
- Extract ALL readable text content from the document
- Preserve document structure (headers, sections, subsections)
- Maintain lists, bullet points, and numbered items

OUTPUT FORMAT:
Structure as professional study material using markdown.

CRITICAL: Return ONLY the extracted and structured content, no meta-commentary about the extraction process.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please extract and structure all educational content from this PDF document.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content.substring(0, 1000)}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
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

    const actualResponse = response.data.choices[0].message.content;
    
    console.log('\n📥 ACTUAL PDF PROCESSING RESPONSE:');
    console.log('='.repeat(60));
    console.log(actualResponse);
    console.log('='.repeat(60));
    
    // Detailed analysis
    const containsSystemPrompt = actualResponse.includes('EXTRACTION REQUIREMENTS') || 
                               actualResponse.includes('OUTPUT FORMAT') ||
                               actualResponse.includes('CRITICAL:');
    
    const containsInstructions = actualResponse.toLowerCase().includes('please provide') || 
                               actualResponse.toLowerCase().includes('i cannot') ||
                               actualResponse.toLowerCase().includes('unable to process');
    
    const containsContent = actualResponse.includes('#') && actualResponse.includes('React');
    
    console.log('\n🔍 DETAILED ANALYSIS:');
    console.log(`❌ Contains system prompt: ${containsSystemPrompt}`);
    console.log(`❌ Contains instructions: ${containsInstructions}`);
    console.log(`✅ Contains actual content: ${containsContent}`);
    
    if (containsSystemPrompt) {
      console.log('\n🚨 ISSUE FOUND: AI is echoing the system prompt!');
      console.log('💡 FIX NEEDED: Simplify the system prompt');
    } else if (containsInstructions) {
      console.log('\n🚨 ISSUE FOUND: AI cannot process PDF base64!');
      console.log('💡 FIX NEEDED: Use text-only processing');
    } else if (containsContent) {
      console.log('\n✅ SUCCESS: PDF processing working correctly');
    }
    
  } catch (error) {
    console.error('❌ PDF debug failed:', error.response?.data || error.message);
  }
}

debugPDFProcessing();