const { contentProcessor } = require('./src/lib/contentProcessor.ts');

async function testAIChunkGeneration() {
  console.log('🧪 Testing AI chunk generation...');
  
  try {
    const testContent = `
      Machine learning is a subset of artificial intelligence that focuses on developing algorithms that can learn and improve from experience.
      
      The key concepts include supervised learning, where algorithms learn from labeled data, and unsupervised learning, where patterns are found in unlabeled data.
      
      Deep learning, which uses neural networks with multiple layers, has revolutionized fields like computer vision and natural language processing.
      
      Applications of machine learning include recommendation systems, fraud detection, medical diagnosis, and autonomous vehicles.
    `;
    
    const session = await contentProcessor.processManualContent(testContent, 'Machine Learning Basics');
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Total chunks created: ${session.chunks.length}`);
    console.log(`⏱️ Total estimated time: ${session.metadata.estimatedTime} minutes`);
    console.log(`🔧 Processing mode: ${session.metadata.processingMode}`);
    
    session.chunks.forEach((chunk, index) => {
      console.log(`\n📝 Chunk ${index + 1}: ${chunk.title}`);
      console.log(`   Content length: ${chunk.content.length} characters`);
      console.log(`   Read time: ${chunk.estimatedReadTime} minutes`);
      console.log(`   Key terms: ${chunk.keyTerms?.join(', ') || 'None'}`);
      
      // Check for clean formatting
      const hasSystemPrompt = chunk.content.includes('system') || chunk.content.includes('prompt');
      const hasProperMarkdown = chunk.content.includes('#') && chunk.content.includes('##');
      
      console.log(`   ✅ Clean content: ${!hasSystemPrompt ? 'Yes' : 'No - Contains system prompts!'}`);
      console.log(`   ✅ Proper markdown: ${hasProperMarkdown ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIChunkGeneration();