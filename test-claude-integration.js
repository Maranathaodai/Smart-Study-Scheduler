const axios = require('axios');
require('dotenv').config();

// Test the enhanced PDF processing directly
async function testEnhancedPDFProcessing() {
  try {
    console.log('🧪 Testing Enhanced PDF Processing with Claude Haiku...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ EXPO_PUBLIC_OPENROUTER_API_KEY environment variable not set');
      return;
    }
    
    // Test with anthropic/claude-3-haiku:beta (our best model)
    const testContent = `# Machine Learning Fundamentals

## Introduction
Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.

## Key Concepts
- **Supervised Learning**: Uses labeled data to train models
- **Unsupervised Learning**: Finds patterns in unlabeled data  
- **Reinforcement Learning**: Learns through interaction with environment

## Applications
1. Image recognition
2. Natural language processing
3. Predictive analytics`;

    // Simulate a PDF base64 (just text for testing)
    const base64Content = Buffer.from(testContent).toString('base64');
    
    console.log('📄 Testing enhanced PDF extraction with claude-3-haiku:beta...');
    
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
- Keep table data organized and readable
- Preserve important formatting and emphasis

OUTPUT FORMAT:
Structure as professional study material using markdown:
# Main Document Title
## Major Sections  
### Subsections
- Key points as bullets
- Important concepts with **emphasis**
#### Learning Objectives (if applicable)
- What students should understand

CRITICAL: Return ONLY the extracted and structured content, no meta-commentary about the extraction process.`
          },
          {
            role: 'user',
            content: `Please extract and structure all educational content from this document. Format it as comprehensive study material with proper headers, sections, and key points.\n\nDocument content: ${testContent}`
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
    
    console.log('\n📊 EXTRACTION RESULT:');
    console.log('='.repeat(50));
    console.log(result);
    console.log('='.repeat(50));
    
    // Check if the result is an instruction response
    const isInstruction = result.toLowerCase().includes('please provide') || 
                         result.toLowerCase().includes('i cannot') ||
                         result.toLowerCase().includes('unable to');
    
    if (isInstruction) {
      console.log('❌ FAILURE: Model returned instruction response instead of content');
    } else {
      console.log('✅ SUCCESS: Model extracted and structured content professionally');
      
      // Check for quality indicators
      const hasHeaders = result.includes('#');
      const hasFormatting = result.includes('**') || result.includes('*');
      const isStructured = result.includes('##') || result.includes('###');
      
      console.log('\n🔍 QUALITY ANALYSIS:');
      console.log(`📝 Has proper headers: ${hasHeaders ? '✅' : '❌'}`);
      console.log(`🎨 Has formatting: ${hasFormatting ? '✅' : '❌'}`);
      console.log(`📊 Is well-structured: ${isStructured ? '✅' : '❌'}`);
      
      if (hasHeaders && hasFormatting && isStructured) {
        console.log('🏆 EXCELLENT: Professional study material quality achieved!');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEnhancedPDFProcessing();