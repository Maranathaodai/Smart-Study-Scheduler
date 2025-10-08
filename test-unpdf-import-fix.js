async function testUnpdfImport() {
  console.log('🧪 Testing unpdf import fix...');
  
  try {
    // Test the import directly first
    console.log('📦 Importing unpdf...');
    const unpdfModule = await import('unpdf');
    console.log('✅ unpdf imported successfully');
    console.log('📦 Module keys:', Object.keys(unpdfModule));
    console.log('📋 extractText type:', typeof unpdfModule.extractText);
    
    // Test the extractText function exists and is callable
    if (typeof unpdfModule.extractText === 'function') {
      console.log('✅ extractText function is available');
    } else {
      console.log('❌ extractText is not a function');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('📊 Error details:', error);
  }
}

testUnpdfImport();