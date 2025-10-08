// Simple test to check AI response formatting

const testJSONResponse = `{
  "title": "Understanding React Hooks",
  "content": "React Hooks are functions that let you use state and other React features in functional components.\\n\\n## What are Hooks?\\n\\nHooks are special functions that start with 'use' and allow you to:\\n\\n- **useState**: Manage component state\\n- **useEffect**: Handle side effects\\n- **useContext**: Access React context\\n\\n### Example\\n\\n\`\`\`javascript\\nconst [count, setCount] = useState(0);\\n\`\`\`\\n\\nThis creates a state variable called count with an initial value of 0."
}`;

function formatAIResponseForDisplay(aiResponse) {
  try {
    console.log('🔍 Original AI Response:');
    console.log(aiResponse);
    console.log('\n' + '='.repeat(50) + '\n');
    
    const cleaned = aiResponse.trim();
    
    // Try to extract JSON if it exists
    if (cleaned.includes('{') && cleaned.includes('}')) {
      // Extract JSON portion
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}') + 1;
      const jsonStr = cleaned.substring(jsonStart, jsonEnd);
      
      console.log('📋 Extracted JSON:');
      console.log(jsonStr);
      console.log('\n' + '-'.repeat(30) + '\n');
      
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ Parsed JSON object:');
        console.log(parsed);
        console.log('\n' + '-'.repeat(30) + '\n');
        
        if (parsed.title && parsed.content) {
          let content = parsed.content;
          
          // Clean up escaped characters
          content = content.replace(/\\n/g, '\n');
          content = content.replace(/\\"/g, '"');
          content = content.replace(/\\\//g, '/');
          
          const formatted = `# ${parsed.title}\n\n${content}`;
          
          console.log('🎨 Formatted Result:');
          console.log(formatted);
          
          return formatted;
        }
      } catch (e) {
        console.log('❌ JSON parsing failed:', e.message);
      }
    }
    
    console.log('⚠️ No JSON found, returning cleaned response');
    return cleaned;
    
  } catch (error) {
    console.log('❌ Error in formatting:', error.message);
    return aiResponse;
  }
}

console.log('🧪 Testing AI Response Formatting\n');
const result = formatAIResponseForDisplay(testJSONResponse);
console.log('\n' + '='.repeat(50));
console.log('🎯 FINAL RESULT:');
console.log('='.repeat(50));
console.log(result);