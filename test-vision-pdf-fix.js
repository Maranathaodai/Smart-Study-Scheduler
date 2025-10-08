const axios = require('axios');
require('dotenv').config();

// Test the fixed PDF processing with actual vision model
async function testFixedPDFProcessing() {
  try {
    console.log('🔧 Testing FIXED PDF Processing with Vision Models...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Create realistic educational content to test with
    const testEducationalContent = `# Machine Learning Fundamentals

## Introduction
Machine learning is a subset of artificial intelligence that enables computers to learn patterns from data without being explicitly programmed.

## Types of Machine Learning

### 1. Supervised Learning
- Uses labeled training data
- Examples: Classification, Regression
- Algorithms: Linear Regression, Decision Trees, SVM

### 2. Unsupervised Learning  
- Finds patterns in unlabeled data
- Examples: Clustering, Dimensionality Reduction
- Algorithms: K-Means, PCA, Hierarchical Clustering

### 3. Reinforcement Learning
- Learns through trial and error
- Uses rewards and penalties
- Applications: Game playing, Robotics

## Key Concepts
- **Training Data**: Data used to train the model
- **Features**: Input variables used for prediction
- **Labels**: Target output for supervised learning
- **Model**: The learned pattern/function
- **Overfitting**: Model performs well on training data but poorly on new data

## Evaluation Metrics
- Accuracy: Percentage of correct predictions
- Precision: True positives / (True positives + False positives)
- Recall: True positives / (True positives + False negatives)
- F1-Score: Harmonic mean of precision and recall`;

    // Convert to base64 (simulating PDF upload)
    const base64Content = Buffer.from(testEducationalContent).toString('base64');
    
    console.log('📄 Test content topic: Machine Learning Fundamentals');
    console.log('📦 Base64 length:', base64Content.length);
    console.log('🎯 Expected: AI should extract content about Machine Learning');
    
    console.log('\n🤖 Testing with Vision Model PDF Processing...');
    
    // Test the fixed approach using vision models
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting text and educational content from PDF documents.

Extract ALL readable text from this PDF document and structure it as study material:
- Read all visible text content
- Preserve document structure (headers, sections, lists)
- Maintain formatting where possible
- Extract educational concepts and key points

Format the output as clean, structured markdown with headers and bullets.
Return ONLY the extracted educational content from the PDF.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please extract all text and educational content from this PDF document and format it as structured study material.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content}`
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
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

    const extractedContent = response.data.choices[0].message.content;
    
    console.log('\n📥 EXTRACTION RESULT:');
    console.log('='.repeat(70));
    console.log(extractedContent);
    console.log('='.repeat(70));
    
    // Analyze content relevance
    const originalTopics = ['Machine Learning', 'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'];
    const extractedLower = extractedContent.toLowerCase();
    const preservedTopics = originalTopics.filter(topic => 
      extractedLower.includes(topic.toLowerCase())
    );
    
    console.log('\n🔍 CONTENT RELEVANCE ANALYSIS:');
    console.log(`📋 Original topics: ${originalTopics.join(', ')}`);
    console.log(`✅ Preserved topics: ${preservedTopics.join(', ')}`);
    console.log(`📊 Preservation rate: ${preservedTopics.length}/${originalTopics.length} (${Math.round(preservedTopics.length/originalTopics.length*100)}%)`);
    
    if (preservedTopics.length >= originalTopics.length * 0.8) {
      console.log('🎉 SUCCESS: Content extraction is accurate and relevant!');
    } else if (preservedTopics.length > 0) {
      console.log('⚠️ PARTIAL: Some content preserved but may have issues');
    } else {
      console.log('❌ FAILURE: Extracted content is completely unrelated to input');
    }
    
    // Check if it's generating random content
    const randomIndicators = ['React Native', 'JavaScript', 'Web Development', 'Node.js', 'Programming'];
    const hasRandomContent = randomIndicators.some(indicator => 
      extractedLower.includes(indicator.toLowerCase())
    );
    
    if (hasRandomContent) {
      console.log('🚨 WARNING: AI is still generating unrelated content!');
    } else {
      console.log('✅ GOOD: No random unrelated content detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFixedPDFProcessing();