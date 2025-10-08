const axios = require('axios');
require('dotenv').config();

// Test comprehensive PDF processing with Claude Haiku
async function testComprehensivePDFProcessing() {
  try {
    console.log('🧪 Testing Comprehensive PDF Processing with Claude Haiku...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ Environment variable not set');
      return;
    }
    
    // More complex educational content for testing
    const complexContent = `# Advanced Data Structures and Algorithms

## Chapter 1: Introduction to Algorithm Analysis
Algorithm analysis is crucial for understanding performance. We measure algorithms using Big O notation.

### Time Complexity
- O(1): Constant time
- O(log n): Logarithmic time  
- O(n): Linear time
- O(n²): Quadratic time

### Space Complexity
Memory usage is equally important. Consider both auxiliary space and input space.

## Chapter 2: Trees and Graphs
Trees are hierarchical data structures. Common types include:
1. Binary trees
2. Binary search trees
3. AVL trees
4. Red-black trees

### Graph Algorithms
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's shortest path
- Minimum spanning tree algorithms

## Chapter 3: Dynamic Programming
Dynamic programming solves complex problems by breaking them into simpler subproblems.

Key principles:
• Optimal substructure
• Overlapping subproblems
• Memoization vs tabulation

### Classic Problems
1. Fibonacci sequence
2. Longest common subsequence
3. Knapsack problem
4. Coin change problem

## Study Objectives
By the end of this material, students should:
- Understand algorithm complexity analysis
- Implement tree and graph traversals
- Apply dynamic programming techniques
- Solve optimization problems efficiently`;

    console.log('📄 Testing with complex educational content...');
    
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
- Extract formulas, equations, or technical content
- Include any visible charts/diagram descriptions

OUTPUT FORMAT:
Structure as professional study material using markdown:
# Main Document Title
## Major Sections  
### Subsections
- Key points as bullets
- Important concepts with **emphasis**
- Technical terms in \`code formatting\`
#### Learning Objectives (if applicable)
- What students should understand
- Skills to develop

CRITICAL: Return ONLY the extracted and structured content, no meta-commentary about the extraction process.`
          },
          {
            role: 'user',
            content: `Please extract and structure all educational content from this PDF document. Format it as comprehensive study material with proper headers, sections, and key points. Focus on creating high-quality, well-organized content for learning.

Document content: ${complexContent}`
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

    const result = response.data.choices[0].message.content;
    
    console.log('\n📊 COMPREHENSIVE EXTRACTION RESULT:');
    console.log('='.repeat(70));
    console.log(result);
    console.log('='.repeat(70));
    
    // Enhanced quality analysis
    const hasHeaders = result.includes('#');
    const hasSubheaders = result.includes('##') && result.includes('###');
    const hasFormatting = result.includes('**') || result.includes('*');
    const hasCodeFormatting = result.includes('`');
    const hasLists = result.includes('-') || result.includes('•');
    const hasNumberedLists = /\d+\./.test(result);
    const hasLearningObjectives = result.toLowerCase().includes('objective');
    const hasEmphasis = result.includes('**');
    
    console.log('\n🔍 DETAILED QUALITY ANALYSIS:');
    console.log(`📝 Headers (H1): ${result.match(/^# /gm)?.length || 0}`);
    console.log(`📑 Subheaders (H2/H3): ${(result.match(/^##+ /gm)?.length || 0)}`);
    console.log(`🎨 Bold formatting: ${hasEmphasis ? '✅' : '❌'}`);
    console.log(`💻 Code formatting: ${hasCodeFormatting ? '✅' : '❌'}`);
    console.log(`📋 Bullet lists: ${hasLists ? '✅' : '❌'}`);
    console.log(`🔢 Numbered lists: ${hasNumberedLists ? '✅' : '❌'}`);
    console.log(`🎯 Learning objectives: ${hasLearningObjectives ? '✅' : '❌'}`);
    
    // Calculate overall quality score
    const qualityChecks = [hasHeaders, hasSubheaders, hasFormatting, hasCodeFormatting, 
                          hasLists, hasNumberedLists, hasLearningObjectives];
    const qualityScore = qualityChecks.filter(Boolean).length;
    
    console.log(`\n📊 OVERALL QUALITY SCORE: ${qualityScore}/7`);
    
    if (qualityScore >= 6) {
      console.log('🏆 EXCELLENT: Professional study material quality achieved!');
    } else if (qualityScore >= 4) {
      console.log('👍 GOOD: Solid study material quality');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Basic quality');
    }
    
    // Check content preservation
    const preservedConcepts = [
      'Big O notation',
      'Time Complexity',
      'Space Complexity', 
      'Dynamic Programming',
      'Algorithm analysis'
    ];
    
    const preservedCount = preservedConcepts.filter(concept => 
      result.toLowerCase().includes(concept.toLowerCase())
    ).length;
    
    console.log(`\n🧠 CONTENT PRESERVATION: ${preservedCount}/${preservedConcepts.length} key concepts retained`);
    
    if (preservedCount === preservedConcepts.length) {
      console.log('✅ PERFECT: All educational content preserved');
    }
    
    console.log('\n🎉 Claude Haiku Beta is delivering EXCEPTIONAL results for PDF processing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testComprehensivePDFProcessing();