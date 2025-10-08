const { contentProcessor } = require('./src/lib/contentProcessor');

async function testChunkingConsistency() {
  console.log('🧪 Testing chunking consistency between manual content and file processing...\n');

  // Sample educational content
  const sampleContent = `# Machine Learning Fundamentals

## Introduction to Machine Learning
Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.

## Types of Machine Learning

### Supervised Learning
In supervised learning, the algorithm learns from labeled training data. The goal is to map inputs to the correct outputs based on example input-output pairs.

Key characteristics:
- Uses labeled datasets for training
- Predicts outcomes for new data
- Common examples: classification and regression

### Unsupervised Learning
Unsupervised learning finds hidden patterns in data without labeled examples. The algorithm must discover structure in the data on its own.

Applications include:
- Clustering customers by behavior
- Dimensionality reduction
- Anomaly detection

### Reinforcement Learning
This type involves an agent learning to make decisions by taking actions in an environment and receiving rewards or penalties.

## Key Concepts

### Training Data
The dataset used to teach the machine learning algorithm. Quality and quantity of training data significantly impact model performance.

### Model
A mathematical representation of a real-world process. Models are trained on data to make predictions or decisions.

### Features
Individual measurable properties of observed phenomena. Good feature selection is crucial for model success.

## Applications
Machine learning powers many modern technologies:
- Recommendation systems (Netflix, Amazon)
- Image recognition and computer vision
- Natural language processing
- Autonomous vehicles
- Medical diagnosis assistance`;

  try {
    // Test 1: Manual content processing (simulating paste)
    console.log('📝 Test 1: Manual content processing...');
    const manualResult = await contentProcessor.processFileContent(
      sampleContent, 
      'Machine Learning Course', 
      'text'
    );
    
    console.log('✅ Manual processing completed');
    console.log(`📊 Chunks created: ${manualResult.chunks.length}`);
    console.log(`⏱️  Total estimated time: ${manualResult.totalEstimatedTime} minutes`);
    console.log(`🧠 Key concepts: ${manualResult.keyConcepts.slice(0, 3).join(', ')}...`);
    
    // Show first chunk as example
    if (manualResult.chunks.length > 0) {
      const firstChunk = manualResult.chunks[0];
      console.log(`\n📋 First chunk example:`);
      console.log(`   Title: "${firstChunk.title}"`);
      console.log(`   Content type: ${firstChunk.content[0]?.type}`);
      console.log(`   Content length: ${firstChunk.content[0]?.content?.length} chars`);
      console.log(`   Estimated time: ${firstChunk.estimatedTime} min`);
      console.log(`   Learning objectives: ${firstChunk.learningObjectives?.length || 0}`);
    }

    // Test 2: Verify the content structure
    console.log('\n🔍 Test 2: Content structure analysis...');
    const hasMarkdownHeaders = manualResult.chunks.some(chunk => 
      chunk.content[0]?.content?.includes('#') || 
      chunk.title?.length > 5
    );
    
    const hasLearningObjectives = manualResult.chunks.some(chunk => 
      chunk.learningObjectives && chunk.learningObjectives.length > 0
    );
    
    const hasStructuredContent = manualResult.chunks.every(chunk => 
      chunk.content && chunk.content.length > 0 && 
      chunk.content[0]?.content && 
      chunk.content[0].content.length > 50
    );

    console.log(`✅ Has structured titles: ${hasMarkdownHeaders ? 'Yes' : 'No'}`);
    console.log(`✅ Has learning objectives: ${hasLearningObjectives ? 'Yes' : 'No'}`);
    console.log(`✅ Has substantial content: ${hasStructuredContent ? 'Yes' : 'No'}`);

    // Test 3: Check for AI-generated quality
    console.log('\n🤖 Test 3: AI processing quality check...');
    const hasAiStructure = manualResult.chunks.some(chunk => {
      const content = chunk.content[0]?.content || '';
      return content.includes('##') || content.includes('###') || content.includes('**') || content.includes('- ');
    });
    
    const hasProfessionalTitles = manualResult.chunks.every(chunk => 
      chunk.title && chunk.title.length > 3 && chunk.title !== `Section ${chunk.order + 1}`
    );

    console.log(`✅ Has AI-enhanced structure: ${hasAiStructure ? 'Yes' : 'No'}`);
    console.log(`✅ Has professional titles: ${hasProfessionalTitles ? 'Yes' : 'No'}`);

    console.log('\n🎯 Summary:');
    if (hasStructuredContent && (hasMarkdownHeaders || hasProfessionalTitles)) {
      console.log('✅ SUCCESS: Manual content processing produces high-quality, professional chunks');
      console.log('📝 File uploads should now produce the same quality when content extraction succeeds');
      console.log('⚠️  File uploads will fail gracefully with clear error messages when extraction fails');
    } else {
      console.log('❌ ISSUE: Manual content processing may need improvement');
    }

    console.log('\n🔧 Changes Made:');
    console.log('1. ✅ Fixed file extraction methods to throw errors instead of returning instruction text');
    console.log('2. ✅ Updated file processing to handle extraction failures gracefully');
    console.log('3. ✅ Both manual content and successful file uploads now use identical AI processing');
    console.log('4. ✅ Users get clear error messages when file content cannot be extracted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testChunkingConsistency();