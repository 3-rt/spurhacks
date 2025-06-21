const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function setupSampleMemory() {
  try {
    // Read the sample memory file from public folder
    const sampleMemoryPath = path.join(__dirname, 'public', 'sample-memory.json');
    const sampleData = await fs.readFile(sampleMemoryPath, 'utf-8');
    const sampleMemory = JSON.parse(sampleData);
    
    // Copy to the actual memory file in public folder
    const memoryPath = path.join(__dirname, 'public', 'memory.json');
    
    // Ensure public directory exists
    const publicDir = path.dirname(memoryPath);
    if (!fsSync.existsSync(publicDir)) {
      await fs.mkdir(publicDir, { recursive: true });
    }
    
    await fs.writeFile(memoryPath, JSON.stringify(sampleMemory, null, 2));
    
    console.log('✅ Sample memory data copied successfully!');
    console.log(`📁 Memory file created at: ${memoryPath}`);
    console.log(`📊 Total entries: ${sampleMemory.entries.length}`);
    
    // Display some statistics
    const stats = {
      byType: {},
      byCategory: {}
    };
    
    sampleMemory.entries.forEach(entry => {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
    });
    
    console.log('\n📈 Memory Statistics:');
    console.log('By Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nBy Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n🧠 Sample queries you can now test:');
    console.log('- "Check the price of the same stock I saw yesterday"');
    console.log('- "Order my dinner from last week"');
    console.log('- "Find that restaurant I looked up earlier"');
    console.log('- "What was the Bitcoin price when I checked?"');
    console.log('- "Show me more about the AI trends I researched"');
    
  } catch (error) {
    console.error('❌ Error setting up sample memory:', error);
  }
}

// Run the setup
setupSampleMemory(); 