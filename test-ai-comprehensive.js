// Comprehensive test to verify AI doesn't return system prompts
const { ContentProcessor } = require('./src/lib/contentProcessor');

async function testAIChunkGeneration() {
  console.log('🧪 COMPREHENSIVE AI SYSTEM PROMPT TEST');
  console.log('=====================================');
  
  const processor = new ContentProcessor();
  
  // Test with different types of content
  const testContents = [
    {
      name: "Normal Educational Content",
      content: `Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence (AI) based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.

The process typically involves feeding data to an algorithm, which then identifies patterns in the data and makes predictions or decisions based on what it has learned. Common applications include recommendation systems, fraud detection, and image recognition.

Key concepts include supervised learning, unsupervised learning, and reinforcement learning. Each approach has different use cases and methodologies.`
    },
    {
      name: "Short Content", 
      content: "JavaScript is a programming language used for web development."
    },
    {
      name: "Technical Content",
      content: `React is a JavaScript library for building user interfaces. It uses a component-based architecture where each component manages its own state. JSX allows you to write HTML-like syntax in JavaScript. The virtual DOM helps optimize performance by minimizing direct DOM manipulation.`
    }
  ];

  for (const test of testContents) {
    console.log(`\n📝 Testing: ${test.name}`);
    console.log('Content length:', test.content.length);
    
    try {
      const session = await processor.processFile(`test-${test.name.replace(/\s+/g, '-').toLowerCase()}.txt`, test.content);
      
      console.log(`✅ Generated ${session.chunks.length} chunks`);
      
      // Check each chunk for system prompt content
      let hasSystemPrompt = false;
      session.chunks.forEach((chunk, index) => {
        console.log(`\n  Chunk ${index + 1}: "${chunk.title}"`);
        console.log(`  Content length: ${chunk.content.length}`);
        console.log(`  First 100 chars: ${chunk.content.substring(0, 100)}...`);
        
        // Check for system prompt indicators
        const systemPromptIndicators = [
          'you are an expert',
          'create study chunks',
          'return only json',
          'transform educational content',
          'chunking requirements',
          'analyze this educational content',
          'writing style guidelines',
          'important:',
          'rules:',
          'guidelines:'
        ];
        
        const contentLower = chunk.content.toLowerCase();
        const titleLower = chunk.title.toLowerCase();
        
        const foundIndicators = systemPromptIndicators.filter(indicator => 
          contentLower.includes(indicator) || titleLower.includes(indicator)
        );
        
        if (foundIndicators.length > 0) {
          console.log(`  ❌ SYSTEM PROMPT DETECTED! Found: ${foundIndicators.join(', ')}`);
          hasSystemPrompt = true;
        } else {
          console.log(`  ✅ Clean content - no system prompt detected`);
        }
      });
      
      if (!hasSystemPrompt) {
        console.log(`\n🎉 ${test.name}: PASSED - No system prompts found!`);
      } else {
        console.log(`\n🚨 ${test.name}: FAILED - System prompts detected!`);
      }
      
    } catch (error) {
      console.log(`❌ Error processing ${test.name}:`, error.message);
    }
  }
  
  console.log('\n🏁 Comprehensive AI test complete!');
}

testAIChunkGeneration().catch(console.error);