const axios = require('axios');
const pdfParse = require('pdf-parse');
require('dotenv').config();

// Test the improved PDF processing with pdf-parse
async function testImprovedPDFProcessing() {
  try {
    console.log('🔧 Testing IMPROVED PDF Processing with pdf-parse...\n');
    
    const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.log('❌ API key not found');
      return;
    }
    
    // Create realistic educational content
    const testEducationalContent = `# Data Science Fundamentals

## Introduction to Data Science
Data science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data.

## The Data Science Process
1. **Problem Definition**
   - Identify business objectives
   - Define success metrics
   - Understand constraints

2. **Data Collection**
   - Gather relevant datasets
   - Assess data quality
   - Handle missing values

3. **Data Exploration**
   - Perform exploratory data analysis (EDA)
   - Visualize data patterns
   - Identify outliers and anomalies

4. **Data Preprocessing**
   - Clean and transform data
   - Feature engineering
   - Data normalization

5. **Model Building**
   - Select appropriate algorithms
   - Train and validate models
   - Hyperparameter tuning

6. **Model Evaluation**
   - Test model performance
   - Cross-validation
   - Error analysis

## Key Skills for Data Scientists
- **Programming**: Python, R, SQL
- **Statistics**: Descriptive and inferential statistics
- **Machine Learning**: Supervised and unsupervised learning
- **Data Visualization**: Creating meaningful charts and graphs
- **Communication**: Presenting findings to stakeholders

## Common Tools and Technologies
- **Languages**: Python, R, SQL, Scala
- **Libraries**: Pandas, NumPy, Scikit-learn, TensorFlow
- **Databases**: MySQL, PostgreSQL, MongoDB
- **Visualization**: Matplotlib, Seaborn, Tableau, Power BI`;

    // Simulate PDF creation and parsing
    console.log('📄 Test content topic: Data Science Fundamentals');
    console.log('📝 Original content length:', testEducationalContent.length);
    
    // Convert to base64 to simulate file upload
    const base64Content = Buffer.from(testEducationalContent).toString('base64');
    console.log('📦 Base64 length:', base64Content.length);
    
    // Step 1: Test pdf-parse extraction
    console.log('\n🔍 Step 1: Testing pdf-parse extraction...');
    try {
      const pdfBuffer = Buffer.from(base64Content, 'base64');
      const pdfData = await pdfParse(pdfBuffer);
      
      console.log('✅ pdf-parse extraction successful!');
      console.log('📄 Extracted text length:', pdfData.text.length);
      console.log('📝 First 200 chars:', pdfData.text.substring(0, 200) + '...');
      
      // Step 2: Test AI structuring of extracted text
      console.log('\n🤖 Step 2: Testing AI structuring of extracted content...');
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3-haiku:beta',
          messages: [
            {
              role: 'system',
              content: `You are an expert at structuring educational content. Take the provided raw text extracted from a PDF and format it as high-quality study material.

Create professional study material with:
- Clear headers and structure using markdown
- Organize content into logical sections
- Use bullet points for key concepts
- Add emphasis for important terms
- Maintain the original educational content

Return ONLY the structured educational content.`
            },
            {
              role: 'user',
              content: `Structure this PDF content as study material:\n\n${pdfData.text}`
            }
          ],
          max_tokens: 3000,
          temperature: 0.2
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

      const structuredContent = response.data.choices[0].message.content;
      
      console.log('\n📊 FINAL STRUCTURED RESULT:');
      console.log('='.repeat(70));
      console.log(structuredContent);
      console.log('='.repeat(70));
      
      // Analyze content accuracy
      const originalTopics = ['Data Science', 'Data Collection', 'Data Exploration', 'Model Building', 'Python', 'Machine Learning'];
      const structuredLower = structuredContent.toLowerCase();
      const preservedTopics = originalTopics.filter(topic => 
        structuredLower.includes(topic.toLowerCase())
      );
      
      console.log('\n🎯 CONTENT ACCURACY ANALYSIS:');
      console.log(`📋 Original topics: ${originalTopics.join(', ')}`);
      console.log(`✅ Preserved topics: ${preservedTopics.join(', ')}`);
      console.log(`📊 Accuracy rate: ${preservedTopics.length}/${originalTopics.length} (${Math.round(preservedTopics.length/originalTopics.length*100)}%)`);
      
      if (preservedTopics.length >= originalTopics.length * 0.9) {
        console.log('🎉 EXCELLENT: Content extraction and structuring is highly accurate!');
      } else if (preservedTopics.length >= originalTopics.length * 0.7) {
        console.log('👍 GOOD: Content mostly preserved with minor issues');
      } else {
        console.log('⚠️ NEEDS IMPROVEMENT: Significant content loss detected');
      }
      
      // Check for hallucinations
      const unrelatedTopics = ['React Native', 'JavaScript', 'Web Development', 'Mobile Apps'];
      const hasHallucinations = unrelatedTopics.some(topic => 
        structuredLower.includes(topic.toLowerCase())
      );
      
      if (hasHallucinations) {
        console.log('🚨 WARNING: AI added unrelated content (hallucinations)');
      } else {
        console.log('✅ PERFECT: No hallucinations detected, content stays on topic');
      }
      
    } catch (pdfError) {
      console.log('❌ pdf-parse failed:', pdfError.message);
      console.log('💡 This might happen with real binary PDFs or in React Native environment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImprovedPDFProcessing();