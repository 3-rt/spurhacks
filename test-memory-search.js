const MemoryManager = require('./memory-manager.js');

async function testMemorySearch() {
  try {
    console.log('🧪 Starting memory test...');
    
    const memoryManager = new MemoryManager('public/memory.json');
    console.log('✅ Memory manager created');
    
    console.log('🧪 Testing Memory Search...\n');
    
    // Test queries
    const testQueries = [
      "check the price of the same stock I saw yesterday",
      "check the price of the same stock yesterday",
      "same stock yesterday",
      "nvidia stock",
      "stock price",
      "yesterday stock"
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      const memories = await memoryManager.searchMemories(query, 3);
      
      if (memories.length > 0) {
        console.log(`✅ Found ${memories.length} memories:`);
        memories.forEach((memory, index) => {
          console.log(`  ${index + 1}. ${memory.description}`);
          console.log(`     Category: ${memory.category}`);
          console.log(`     Tags: ${memory.tags.join(', ')}`);
          if (memory.details.stock_symbol) {
            console.log(`     Stock Symbol: ${memory.details.stock_symbol}`);
          }
        });
      } else {
        console.log('❌ No memories found');
      }
    }
    
    // Show all memories for reference
    console.log('\n📋 All available memories:');
    const allMemories = await memoryManager.getAllMemories();
    console.log(`Total memories: ${allMemories.length}`);
    allMemories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.description} (${memory.category})`);
      if (memory.details.stock_symbol) {
        console.log(`     Stock: ${memory.details.stock_symbol}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing memory search:', error);
    console.error('Stack trace:', error.stack);
  }
}

console.log('🚀 Starting test...');
testMemorySearch().then(() => {
  console.log('✅ Test completed');
}).catch((error) => {
  console.error('❌ Test failed:', error);
}); 