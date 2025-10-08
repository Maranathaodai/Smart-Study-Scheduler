const { contentProcessor } = require('./src/lib/contentProcessor');

console.log('🧪 Testing contentProcessor methods...');
console.log('contentProcessor:', typeof contentProcessor);
console.log('processFileContent method:', typeof contentProcessor.processFileContent);
console.log('processFile method:', typeof contentProcessor.processFile);
console.log('processManualContent method:', typeof contentProcessor.processManualContent);

if (typeof contentProcessor.processFileContent === 'function') {
  console.log('✅ processFileContent method exists and is a function');
} else {
  console.log('❌ processFileContent method is missing or not a function');
}

// List all methods
console.log('\nAll methods on contentProcessor:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(contentProcessor))
  .filter(name => typeof contentProcessor[name] === 'function' && name !== 'constructor')
);