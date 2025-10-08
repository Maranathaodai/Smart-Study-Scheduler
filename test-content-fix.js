const { contentProcessor } = require('./src/lib/contentProcessor');

async function testContentFix() {
  console.log('🔧 Testing Content Fix...');
  
  try {
    const testContent = 'React is a JavaScript library for building user interfaces. It uses components to create interactive web applications.';
    
    const session = await contentProcessor.processFile('test.txt', testContent);
    
    console.log('\n📚 Chunk Title:', session.chunks[0].title);
    console.log('\n📖 Content:');
    console.log(session.chunks[0].content[0].content);
    console.log('\n✅ Content length:', session.chunks[0].content[0].content.length, 'characters');
    
    if (session.chunks[0].content[0].content.length < 10) {
      console.log('❌ PROBLEM: Content is too short!');
    } else {
      console.log('✅ SUCCESS: Content looks good!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContentFix();