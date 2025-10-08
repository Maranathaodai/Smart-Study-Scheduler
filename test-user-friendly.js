const { contentProcessor } = require('./src/lib/contentProcessor');

async function testUserFriendlyContent() {
  console.log('🎨 Testing User-Friendly Content Generation');
  console.log('==========================================');
  
  const testContent = `
    React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and the open-source community.
    
    React uses a component-based architecture where the UI is broken down into reusable components. Each component manages its own state and can be composed to build complex user interfaces.
    
    Key concepts include JSX (JavaScript XML), which allows you to write HTML-like syntax in JavaScript, and the Virtual DOM, which helps optimize performance by minimizing direct DOM manipulation.
    
    React also introduces hooks, which allow you to use state and other React features in functional components without writing class components.
  `;
  
  try {
    const session = await contentProcessor.processFile('react-tutorial.txt', testContent);
    
    console.log(`\n✅ Generated ${session.chunks.length} chunks\n`);
    
    session.chunks.forEach((chunk, index) => {
      console.log(`📚 Chunk ${index + 1}: "${chunk.title}"`);
      console.log(`⏱️  Estimated time: ${chunk.estimatedTime} minutes`);
      console.log(`📖 Content preview:`);
      
      // Get the actual content from the ProcessedContent array
      const content = chunk.content[0]?.content || 'No content';
      const preview = content.substring(0, 200);
      console.log(`   ${preview}${content.length > 200 ? '...' : ''}`);
      
      // Check for markdown syntax (should not be present)
      const hasMarkdown = /^#+\s|^\*\*|\*\*$|^-\s|^##|^\*\s/.test(content);
      const hasCleanFormatting = content.includes('•') || content.includes('1.') || content.includes('2.');
      
      console.log(`   ✅ Clean formatting (no markdown): ${!hasMarkdown ? 'Yes' : 'No - Found markdown!'}`);
      console.log(`   ✅ User-friendly formatting: ${hasCleanFormatting ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserFriendlyContent();