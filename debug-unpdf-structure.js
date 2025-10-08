// Debug the unpdf module structure in React Native context
async function debugUnpdfStructure() {
  console.log('🔍 Debugging unpdf module structure...');
  
  try {
    const unpdfModule = await import('unpdf');
    console.log('📦 Module keys:', Object.keys(unpdfModule));
    console.log('📋 Default export type:', typeof unpdfModule.default);
    
    if (unpdfModule.default) {
      console.log('📦 Default export keys:', Object.keys(unpdfModule.default));
      console.log('📋 Default.extractText type:', typeof unpdfModule.default.extractText);
      
      // Test each possible way to access extractText
      const methods = [
        { name: 'unpdfModule.extractText', value: unpdfModule.extractText },
        { name: 'unpdfModule.default', value: unpdfModule.default },
        { name: 'unpdfModule.default.extractText', value: unpdfModule.default?.extractText }
      ];
      
      methods.forEach(method => {
        console.log(`📋 ${method.name}:`, typeof method.value);
        if (typeof method.value === 'function') {
          console.log(`✅ Found working method: ${method.name}`);
        }
      });
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugUnpdfStructure();