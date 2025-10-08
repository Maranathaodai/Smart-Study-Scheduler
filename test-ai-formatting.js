const { contentProcessor } = require('./src/lib/contentProcessor');

async function testAIFormatting() {
  console.log('🎨 Testing AI Content Formatting...');
  
  // Simulate what the user saw in the screenshot
  const mockAIResponse = `[
  {
    "title": "Team Kasa's Hackathon Project",
    "content": "## Overview\\nThis chunk analyzes Team Kasa's project from a hackathon focused on speech impairment solutions.\\n\\n## Key Points\\n- Team Kasa's solution relied on Telegram integration.\\n- This approach excluded individuals without smartphones, Telegram accounts, or stable data access.\\n\\n## Summary\\nTeam Kasa's project, while innovative, raised concerns about its inclusivity due to its reliance on Telegram. This sparked discussions about the importance of diverse user needs in assistive technology design.",
    "estimatedTime": 10,
    "complexity": 3,
    "learningObjectives": [
      "Understand the limitations of Team Kasa's solution.",
      "Recognize the importance of inclusivity in assistive technology."
    ],
    "keywords": [
      "Team Kasa",
      "Telegram", 
      "inclusivity",
      "assistive technology"
    ],
    "assessmentQuestions": [
      "What was the primary technology used in Team Kasa's solution?"
    ]
  }
]`;

  try {
    // Test the formatting method directly
    const processor = contentProcessor;
    const formatted = processor.formatAIResponseForDisplay(mockAIResponse);
    
    console.log('\n📖 Formatted Content:');
    console.log('='.repeat(50));
    console.log(formatted);
    console.log('='.repeat(50));
    
    console.log('\n✅ Length:', formatted.length, 'characters');
    console.log('✅ Contains title:', formatted.includes('Team Kasa'));
    console.log('✅ Contains formatted content:', formatted.includes('##'));
    console.log('✅ Readable format:', !formatted.includes('\\"'));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIFormatting();