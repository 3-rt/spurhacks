const fs = require('fs').promises;
const path = require('path');

class MemoryManager {
  constructor(memoryFilePath = 'public/memory.json') {
    this.memoryFilePath = memoryFilePath;
  }

  /**
   * Get all memories
   */
  async getAllMemories() {
    try {
      const data = await fs.readFile(this.memoryFilePath, 'utf-8');
      const memory = JSON.parse(data);
      return memory.entries || [];
    } catch (error) {
      console.log('No memory file found, starting fresh');
      return [];
    }
  }

  /**
   * Search memories by query
   */
  async searchMemories(query, limit = 5) {
    const memories = await this.getAllMemories();
    const queryLower = query.toLowerCase();
    
    const relevantMemories = memories
      .filter(memory => {
        return memory.description.toLowerCase().includes(queryLower) ||
               memory.category.toLowerCase().includes(queryLower) ||
               memory.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
               memory.relatedQueries.some(q => q.toLowerCase().includes(queryLower));
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return relevantMemories;
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    const memories = await this.getAllMemories();
    const stats = {
      total: memories.length,
      byType: {},
      byCategory: {},
      recent: memories.slice(0, 5).map(m => ({
        id: m.id,
        description: m.description,
        category: m.category,
        timestamp: m.timestamp
      }))
    };

    memories.forEach(memory => {
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;
      stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all memories
   */
  async clearAllMemories() {
    try {
      await fs.writeFile(this.memoryFilePath, JSON.stringify({
        entries: [],
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }, null, 2));
      return { success: true, message: 'All memories cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a specific memory
   */
  async deleteMemory(memoryId) {
    try {
      const data = await fs.readFile(this.memoryFilePath, 'utf-8');
      const memory = JSON.parse(data);
      
      const index = memory.entries.findIndex(entry => entry.id === memoryId);
      if (index === -1) {
        return { success: false, error: 'Memory not found' };
      }
      
      memory.entries.splice(index, 1);
      memory.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.memoryFilePath, JSON.stringify(memory, null, 2));
      return { success: true, message: 'Memory deleted' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = MemoryManager; 