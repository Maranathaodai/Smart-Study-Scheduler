// Test the enhanced vision models for PDF processing
const { openRouterClient } = require('./src/lib/openrouter.ts');

async function testEnhancedPDFProcessing() {
  try {
    console.log('🧪 Testing Enhanced PDF Processing with Superior Vision Models...\n');
    
    // Create a simple PDF-like base64 content for testing
    const testPDFContent = Buffer.from('Sample PDF Content: Introduction to Machine Learning').toString('base64');
    
    console.log('📄 Testing enhanced PDF extraction...');
    const result = await openRouterClient.extractStructuredPDFContent(testPDFContent);
    
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
      console.log('✅ SUCCESS: Model extracted actual content');
    }
    
    console.log('\n🏆 Enhanced vision model test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedPDFProcessing();