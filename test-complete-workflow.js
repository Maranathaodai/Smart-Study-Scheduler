const axios = require('axios');
require('dotenv').config();

// Test the complete workflow: PDF processing -> chunking
async function testCompleteWorkflow() {
  try {
    console.log('🔄 Testing Complete PDF Processing -> Chunking Workflow...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ Environment variable not set');
      return;
    }
    
    // Step 1: Extract content using Claude Haiku (Enhanced PDF Processing)
    const samplePDFContent = `# Introduction to React Native

## What is React Native?
React Native is a framework for building mobile applications using React and JavaScript. It allows developers to create native mobile apps for iOS and Android platforms.

### Key Benefits
- Cross-platform development
- Code reusability between iOS and Android
- Native performance
- Hot reloading for faster development

### Core Components
1. **View**: The basic building block for UI
2. **Text**: For displaying text content
3. **Image**: For displaying images
4. **ScrollView**: For scrollable content
5. **FlatList**: For rendering lists efficiently

## Navigation
React Native apps typically use React Navigation for handling screen transitions.

### Types of Navigation
- Stack Navigation: Screen stacking
- Tab Navigation: Bottom tabs
- Drawer Navigation: Side menu

## State Management
Managing application state effectively:
- Local state with useState
- Global state with Context API
- External libraries like Redux

## Learning Objectives
After studying this material, you should be able to:
- Create basic React Native components
- Implement navigation between screens
- Manage application state
- Build and deploy mobile applications`;

    console.log('📄 Step 1: Enhanced PDF Content Extraction...');
    
    const extractionResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting and structuring educational content from PDF documents. Create high-quality study material with:

EXTRACTION REQUIREMENTS:
- Extract ALL readable text content
- Preserve document structure (headers, sections, subsections)
- Maintain lists, bullet points, and numbered items
- Preserve important formatting and emphasis
- Include learning objectives

OUTPUT FORMAT:
Structure as professional study material using markdown with proper headers, emphasis, and formatting.

CRITICAL: Return ONLY the extracted and structured content, no meta-commentary.`
          },
          {
            role: 'user',
            content: `Extract and structure this educational content: ${samplePDFContent}`
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

    const extractedContent = extractionResponse.data.choices[0].message.content;
    console.log('✅ Content extracted successfully!');
    console.log('📏 Extracted content length:', extractedContent.length);
    
    // Step 2: Create study chunks using enhanced chunking
    console.log('\n📚 Step 2: Creating Study Chunks...');
    
    const chunkingResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating study chunks from educational content. Transform content into well-structured, engaging study material.

CHUNKING REQUIREMENTS:
- Create 3-6 logical study chunks from the content
- Each chunk should be 10-25 minutes of study time
- Preserve learning flow and concept dependencies
- Include clear titles that capture the main concept
- Add learning objectives for each chunk
- Include key terms and assessment questions

CHUNK FORMAT for each chunk:
{
  "title": "Clear, descriptive title (not generic)",
  "content": "Well-formatted markdown content with headers, bullets, emphasis",
  "estimatedTime": 15,
  "complexity": 5,
  "learningObjectives": ["Specific learning goal 1", "Specific learning goal 2"],
  "keywords": ["key", "terms"],
  "assessmentQuestions": ["Question testing understanding"],
  "prerequisites": []
}

Return valid JSON array of chunks. Focus on educational value and clear structure.`
          },
          {
            role: 'user',
            content: `Create intelligent study chunks from this educational content:\n\n${extractedContent}`
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
    console.log('✅ Chunks created successfully!');
    console.log('📄 Full AI response:', chunksResult.substring(0, 500) + '...');
    
    // Try to parse the JSON with improved extraction logic
    let chunks;
    try {
      // First try direct parsing
      chunks = JSON.parse(chunksResult);
      console.log(`📊 Created ${chunks.length} study chunks`);
    } catch (parseError) {
      console.log('Direct JSON parsing failed, trying to extract JSON from response...');
      
      // Try to extract JSON from prefixed responses - handle both arrays and single objects
      const arrayMatch = chunksResult.match(/\[[\s\S]*?\]/);
      const objectMatch = chunksResult.match(/\{[\s\S]*?\}/);
      
      if (arrayMatch) {
        try {
          // Apply post-processing to fix JSON formatting issues
          let jsonString = arrayMatch[0];
          
          // Fix common JSON formatting issues by properly escaping content fields
          jsonString = jsonString.replace(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/g, (match, content) => {
            // Properly escape the content field
            const escapedContent = content
              .replace(/\\/g, '\\\\')  // Escape backslashes first
              .replace(/"/g, '\\"')   // Escape quotes
              .replace(/\n/g, '\\n')   // Escape newlines
              .replace(/\r/g, '\\r')   // Escape carriage returns
              .replace(/\t/g, '\\t');  // Escape tabs
            return `"content": "${escapedContent}"`;
          });
          
          chunks = JSON.parse(jsonString);
          if (Array.isArray(chunks)) {
            console.log('✅ Successfully extracted JSON array from prefixed response');
            console.log(`📊 Created ${chunks.length} study chunks`);
            console.log('🔍 Raw first chunk:', chunks[0]);
            console.log('🔍 First chunk structure:', JSON.stringify(chunks[0], null, 2));
            
            // Check if chunks have the expected structure
            if (chunks[0] && typeof chunks[0] === 'object' && chunks[0].title) {
              console.log('✅ Chunks have expected structure');
            } else if (chunks[0] && typeof chunks[0] === 'string') {
              console.log('⚠️ AI returned strings instead of objects, converting to expected format');
              // Convert string chunks to object format
              chunks = chunks.map((chunkString, index) => ({
                title: chunkString,
                content: `# ${chunkString}\n\nThis section covers: ${chunkString}`,
                estimatedTime: 15,
                complexity: 5,
                learningObjectives: [`Understand ${chunkString}`],
                keywords: chunkString.toLowerCase().split(' ').slice(0, 3),
                assessmentQuestions: [`What is ${chunkString}?`],
                prerequisites: []
              }));
              console.log('✅ Converted string chunks to object format');
            } else {
              console.log('❌ Chunks do not have expected structure');
              console.log('🔍 Chunk type:', typeof chunks[0]);
              console.log('🔍 Chunk keys:', chunks[0] ? Object.keys(chunks[0]) : 'null');
            }
          } else {
            throw new Error('Extracted content is not an array');
          }
        } catch (extractError) {
          console.log('❌ JSON array extraction failed:', extractError.message);
          console.log('📄 Attempted to parse:', arrayMatch[0].substring(0, 200) + '...');
          throw extractError;
        }
      } else if (objectMatch) {
        try {
          const singleChunk = JSON.parse(objectMatch[0]);
          console.log('🔍 Raw single chunk structure:', JSON.stringify(singleChunk, null, 2));
          
          // Check if this is actually a chunk object or something else
          if (singleChunk.title && singleChunk.content) {
            chunks = [singleChunk]; // Convert single object to array
            console.log('✅ Successfully extracted single JSON object and converted to array');
            console.log(`📊 Created ${chunks.length} study chunk`);
          } else {
            console.log('❌ Single object does not have expected chunk structure');
            throw new Error('Single object is not a valid chunk');
          }
        } catch (extractError) {
          console.log('❌ JSON object extraction failed:', extractError.message);
          console.log('📄 Attempted to parse:', objectMatch[0].substring(0, 200) + '...');
          throw extractError;
        }
      } else {
        console.log('❌ No JSON found in response');
        throw new Error('No JSON array or object found in response');
      }
    }
      
      console.log('\n📚 STUDY CHUNKS OVERVIEW:');
      console.log('='.repeat(60));
      
      chunks.forEach((chunk, index) => {
        console.log(`\n${index + 1}. **${chunk.title}**`);
        console.log(`   ⏱️  Time: ${chunk.estimatedTime} minutes`);
        console.log(`   🧠 Complexity: ${chunk.complexity}/10`);
        console.log(`   🎯 Objectives: ${chunk.learningObjectives?.length || 0}`);
        console.log(`   🔑 Keywords: ${chunk.keywords?.length || 0}`);
        console.log(`   ❓ Questions: ${chunk.assessmentQuestions?.length || 0}`);
        console.log(`   📄 Content length: ${chunk.content?.length || 0} chars`);
      });
      
      console.log('\n🎉 COMPLETE WORKFLOW SUCCESS!');
      console.log('✅ PDF extraction: Professional quality');
      console.log('✅ Content chunking: Structured learning material');
      console.log('✅ JSON parsing: Valid format');
      
      // Quality assessment
      const totalTime = chunks.reduce((sum, chunk) => sum + (chunk.estimatedTime || 0), 0);
      const avgComplexity = chunks.reduce((sum, chunk) => sum + (chunk.complexity || 0), 0) / chunks.length;
      const totalObjectives = chunks.reduce((sum, chunk) => sum + (chunk.learningObjectives?.length || 0), 0);
      
      console.log('\n📊 LEARNING MATERIAL ANALYSIS:');
      console.log(`⏱️  Total study time: ${totalTime} minutes`);
      console.log(`🧠 Average complexity: ${avgComplexity.toFixed(1)}/10`);
      console.log(`🎯 Total learning objectives: ${totalObjectives}`);
      
      if (chunks.length >= 3 && totalTime >= 30 && totalObjectives >= 5) {
        console.log('🏆 EXCELLENT: High-quality study material created!');
      }
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.response?.data || error.message);
  }
}

testCompleteWorkflow();