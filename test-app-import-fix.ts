// Test the unpdf import fix in React Native context
// Run this with: npx ts-node test-app-import-fix.ts

import { OpenRouterClient } from './src/lib/openrouter';

async function testUnpdfInApp() {
  console.log('🧪 Testing unpdf import in app context...');
  
  try {
    const client = new OpenRouterClient();
    
    // Create a minimal PDF in base64 for testing
    const testPDFBase64 = 'JVBERi0xLjQKJcOkw7zDtsOAcApbLA0KCjEgMCBvYmogIDo6IGNvb3JkCjw8L1BhZ2VzIDMgMCBSCi9UeXBlIC9DYXRhbG9nPj4gIDo6IGNvb3JkCmVuZG9iag0KMiAwIG9iaiAgOjo6IGNvb3JkIDo6CjA8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL1Jlc291cmNlcyA8PC9Gb250IDw8L0Y0IDQgMCBSPj4KL1Byb2NTZXQgMCBbL1BERiAvVGV4dF0+Pgo+PiAgOjo6IGNvb3JkIDo6CmVuZG9iag0KMyAwIG9iaiAgOjo6ICBjb29yZCA6OgosIDM8PC9UeXBlIC9QYWdlcz4+ICAKZW5kb2JqCjQgMCBvYmogIDo6OiBjb29yZCA6Ojo6CjMsIDAgPDwvVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTE+PgplbmRvYmoNCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiANCjAwMDAwMDAwMDkgMDAwMDAgbiANCjAwMDAwMDAwNzQgMDAwMDAgbiANCjAwMDAwMDAyMDggMDAwMDAgbiANCjAwMDAwMDAyNzMgMDAwMDAgbiANCnRyYWlsZXIKPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzMzCiUlRU9G';
    
    console.log('📄 Testing PDF processing with import fix...');
    const result = await client.extractStructuredPDFContent(testPDFBase64);
    
    console.log('✅ PDF processing completed successfully!');
    console.log('📊 Result length:', result?.length || 0);
    console.log('📋 Result preview:', result?.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📊 Error stack:', error.stack);
  }
}

testUnpdfInApp();