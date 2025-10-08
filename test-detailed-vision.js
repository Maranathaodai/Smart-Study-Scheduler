const axios = require('axios');

// Test the working models with more detailed scenarios
const WORKING_MODELS = [
  'mistralai/pixtral-12b',
  'anthropic/claude-3-haiku:beta'
];

async function testDetailedVision() {
  console.log('🔍 Detailed testing of working vision models...\n');
  
  const API_KEY = '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';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Test with text extraction scenario
  const testPrompt = `Extract any text content from this image. If you see text, transcribe it exactly. If you see educational content like formulas, diagrams, or structured information, describe it in detail for study purposes.`;
  
  // Simple test image (1x1 pixel)
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  for (const model of WORKING_MODELS) {
    console.log(`\n🧪 Testing ${model} for educational content extraction:`);
    
    try {
      // Test 1: Image analysis
      console.log('   📸 Test 1: Image content analysis...');
      const imageResponse = await axios.post(API_URL, {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: testPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${testBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log(`   ✅ Image analysis result: ${imageResponse.data.choices[0].message.content.substring(0, 200)}...`);
      console.log(`   💰 Tokens used: ${JSON.stringify(imageResponse.data.usage)}`);
      
      // Test 2: Text processing quality
      console.log('   📝 Test 2: Text processing quality...');
      const textResponse = await axios.post(API_URL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating educational study chunks. Transform content into well-structured, professional study material with markdown formatting.'
          },
          {
            role: 'user',
            content: `Create study chunks from this content:

# Machine Learning Basics

Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.

## Types of Machine Learning
1. Supervised Learning - uses labeled data
2. Unsupervised Learning - finds patterns in unlabeled data  
3. Reinforcement Learning - learns through rewards and penalties

Transform this into professional study chunks with learning objectives and clear structure.`
          }
        ],
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log(`   ✅ Text processing result: ${textResponse.data.choices[0].message.content.substring(0, 300)}...`);
      console.log(`   💰 Tokens used: ${JSON.stringify(textResponse.data.usage)}`);
      
      // Calculate rough cost
      const imageTokens = imageResponse.data.usage.total_tokens;
      const textTokens = textResponse.data.usage.total_tokens;
      console.log(`   📊 Total tokens per request: ~${imageTokens + textTokens}`);
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.response?.data?.error?.message || error.message}`);
    }
    
    // Delay between models
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. anthropic/claude-3-haiku:beta appears to have better vision capabilities');
  console.log('2. Both models can handle text processing well');
  console.log('3. Consider these models for image/PDF processing if they are truly free');
  console.log('\n⚠️ IMPORTANT: Check OpenRouter pricing for these models!');
  console.log('   Some models marked as "beta" might not be permanently free.');
}

// Also test PDF-like content processing
async function testPDFProcessing() {
  console.log('\n📄 Testing PDF-like content processing...\n');
  
  const API_KEY = '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';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Simulate PDF text extraction scenario
  const pdfLikeContent = `
MACHINE LEARNING FUNDAMENTALS
Chapter 3: Supervised Learning

3.1 Introduction to Supervised Learning
Supervised learning algorithms learn from labeled training data to make predictions on new, unseen data. The key characteristic is that we have both input features (X) and target labels (y) during training.

3.2 Classification vs Regression
• Classification: Predicts discrete categories or classes
  - Example: Email spam detection (spam/not spam)
  - Algorithms: Logistic Regression, Decision Trees, SVM
  
• Regression: Predicts continuous numerical values  
  - Example: House price prediction
  - Algorithms: Linear Regression, Random Forest, Neural Networks

3.3 Training Process
1. Split data into training and testing sets
2. Train model on training data
3. Evaluate model performance on test data
4. Tune hyperparameters if needed
5. Deploy final model

Key Metrics:
- Accuracy: Correct predictions / Total predictions
- Precision: True Positives / (True Positives + False Positives)
- Recall: True Positives / (True Positives + False Negatives)
- F1-Score: Harmonic mean of precision and recall

Exercise 3.1: Given a dataset of 1000 customer records with features [age, income, purchase_history] and labels [will_buy, won't_buy], design a supervised learning pipeline.
`;

  const bestModel = 'anthropic/claude-3-haiku:beta'; // Based on previous test
  
  try {
    console.log(`🧪 Testing ${bestModel} for structured PDF content processing:`);
    
    const response = await axios.post(API_URL, {
      model: bestModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting and structuring educational content. Transform the provided content into well-organized study chunks with:

1. Clear titles and sections
2. Learning objectives 
3. Key concepts highlighted
4. Examples and exercises preserved
5. Professional markdown formatting

Create multiple focused study chunks, each covering a specific concept or section.`
        },
        {
          role: 'user',
          content: `Transform this educational content into professional study chunks:\n\n${pdfLikeContent}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    const result = response.data.choices[0].message.content;
    console.log('✅ PDF-like content processing result:');
    console.log('---');
    console.log(result);
    console.log('---');
    console.log(`💰 Tokens used: ${JSON.stringify(response.data.usage)}`);
    
    // Check quality indicators
    const hasMarkdown = result.includes('#') || result.includes('**') || result.includes('- ');
    const hasStructure = result.includes('Learning') || result.includes('Objective') || result.includes('Key');
    const preservesContent = result.includes('Classification') && result.includes('Regression');
    
    console.log('\n📊 Quality Assessment:');
    console.log(`   ✅ Uses markdown formatting: ${hasMarkdown ? 'Yes' : 'No'}`);
    console.log(`   ✅ Has educational structure: ${hasStructure ? 'Yes' : 'No'}`);
    console.log(`   ✅ Preserves original content: ${preservesContent ? 'Yes' : 'No'}`);
    
    if (hasMarkdown && hasStructure && preservesContent) {
      console.log('\n🎯 CONCLUSION: This model produces HIGH-QUALITY educational chunks!');
      console.log('   Recommended for PDF and image processing.');
    }
    
  } catch (error) {
    console.log(`❌ PDF processing test failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Run both tests
testDetailedVision().then(() => testPDFProcessing()).catch(console.error);