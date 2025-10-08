const axios = require('axios');
require('dotenv').config();

// Test the complete fixed workflow
async function testCompleteFixedWorkflow() {
  try {
    console.log('🔧 Testing COMPLETE FIXED Workflow...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Simulate a real educational PDF content
    const realEducationalContent = `# Data Structures and Algorithms

## Introduction to Arrays
Arrays are one of the fundamental data structures in computer science. They store elements in contiguous memory locations.

### Array Operations
1. Insertion - Adding elements
2. Deletion - Removing elements  
3. Traversal - Visiting each element
4. Search - Finding specific elements

### Time Complexities
- Access: O(1)
- Search: O(n)
- Insertion: O(n)
- Deletion: O(n)

## Linked Lists
Linked lists are dynamic data structures where elements are stored in nodes.

### Types of Linked Lists
- Singly Linked List
- Doubly Linked List
- Circular Linked List

### Advantages
- Dynamic size
- Efficient insertion/deletion at beginning
- Memory efficient

### Disadvantages
- No random access
- Extra memory for pointers
- Not cache friendly

## Stacks and Queues

### Stack (LIFO - Last In First Out)
- push() - Add element to top
- pop() - Remove element from top
- peek() - View top element
- isEmpty() - Check if stack is empty

### Queue (FIFO - First In First Out)  
- enqueue() - Add element to rear
- dequeue() - Remove element from front
- front() - View front element
- isEmpty() - Check if queue is empty`;

    console.log('📄 Testing with realistic educational content...');
    console.log('📏 Content length:', realEducationalContent.length);
    
    // Step 1: Process as PDF (base64 -> text -> enhanced processing)
    const base64Content = Buffer.from(realEducationalContent).toString('base64');
    let textContent = Buffer.from(base64Content, 'base64').toString('utf-8');
    
    console.log('\n🤖 Step 1: Enhanced Content Processing...');
    const processingResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating structured educational content. Transform the provided content into high-quality study material.

Create professional study material with:
- Clear headers and structure
- Well-formatted markdown
- Key points as bullet lists
- Important concepts with emphasis
- Learning objectives when appropriate

Return ONLY the structured educational content, no explanations.`
          },
          {
            role: 'user',
            content: `Transform this content into structured study material:\n\n${textContent}`
          }
        ],
        max_tokens: 3000,
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

    const processedContent = processingResponse.data.choices[0].message.content;
    console.log('✅ Content processing complete');
    
    // Step 2: Create study chunks
    console.log('\n📚 Step 2: Creating Study Chunks...');
    const chunkingResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `Create study chunks from educational content. Each chunk should be a complete learning unit.

Format each chunk as JSON:
{
  "title": "Descriptive title",
  "content": "Markdown content",
  "estimatedTime": 15,
  "complexity": 6,
  "learningObjectives": ["objective 1", "objective 2"],
  "keywords": ["key", "terms"],
  "assessmentQuestions": ["question 1"]
}

Return valid JSON array of 3-5 chunks.`
          },
          {
            role: 'user',
            content: `Create study chunks from this content:\n\n${processedContent}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
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

    const chunksResult = chunkingResponse.data.choices[0].message.content;
    console.log('✅ Chunking complete');
    
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(60));
    
    // Display processed content (first 500 chars)
    console.log('📝 PROCESSED CONTENT:');
    console.log(processedContent.substring(0, 500) + '...\n');
    
    // Try to parse chunks
    try {
      const chunks = JSON.parse(chunksResult);
      console.log(`📚 CREATED ${chunks.length} STUDY CHUNKS:`);
      
      chunks.forEach((chunk, index) => {
        console.log(`\n${index + 1}. "${chunk.title}"`);
        console.log(`   ⏱️ ${chunk.estimatedTime || 'N/A'} minutes`);
        console.log(`   🧠 Complexity: ${chunk.complexity || 'N/A'}/10`);
        console.log(`   🎯 Objectives: ${chunk.learningObjectives?.length || 0}`);
        console.log(`   📄 Content: ${chunk.content?.length || 0} chars`);
      });
      
      console.log('\n🎉 COMPLETE SUCCESS: Fixed workflow working perfectly!');
      
    } catch (parseError) {
      console.log('⚠️ Chunks created but not in JSON format:');
      console.log(chunksResult.substring(0, 300) + '...');
    }
    
    // Verify content preservation
    const keyTerms = ['Arrays', 'Linked Lists', 'Stack', 'Queue', 'LIFO', 'FIFO'];
    const preservedTerms = keyTerms.filter(term => 
      processedContent.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log('\n🔍 CONTENT VERIFICATION:');
    console.log(`📋 Key terms preserved: ${preservedTerms.length}/${keyTerms.length}`);
    console.log(`✅ Terms found: ${preservedTerms.join(', ')}`);
    
    if (preservedTerms.length >= keyTerms.length * 0.8) {
      console.log('🏆 EXCELLENT: High content preservation rate!');
    }
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.response?.data || error.message);
  }
}

testCompleteFixedWorkflow();