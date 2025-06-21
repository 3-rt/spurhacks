const fs = require('fs').promises;
const path = require('path');

class MemoryManager {
  constructor(memoryFilePath = path.join(__dirname, 'public', 'memory.json')) {
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
    
    // Check for time-based or "same" queries
    const isTimeBasedQuery = queryLower.includes("yesterday") || 
                            queryLower.includes("last week") || 
                            queryLower.includes("earlier") || 
                            queryLower.includes("same") ||
                            queryLower.includes("previous");
    
    const relevantMemories = memories
      .filter(memory => {
        // Basic keyword matching
        const basicMatch = memory.description.toLowerCase().includes(queryLower) ||
                          memory.category.toLowerCase().includes(queryLower) ||
                          memory.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
                          memory.relatedQueries.some(q => q.toLowerCase().includes(queryLower));
        
        if (basicMatch) return true;
        
        // Special handling for time-based queries
        if (isTimeBasedQuery) {
          // For "same stock" queries, look for stock-related memories
          if (queryLower.includes("stock") && memory.category === "finance") {
            return true;
          }
          
          // For "same food" queries, look for food-related memories
          if ((queryLower.includes("food") || queryLower.includes("dinner") || queryLower.includes("lunch")) && 
              memory.category === "shopping" && memory.details?.restaurant_chain) {
            return true;
          }
          
          // For "same restaurant" queries, look for restaurant memories
          if (queryLower.includes("restaurant") && memory.details?.restaurant_chain) {
            return true;
          }
          
          // For "yesterday" queries, prioritize recent memories (within last 2 days)
          if (queryLower.includes("yesterday")) {
            const entryDate = new Date(memory.timestamp);
            const now = new Date();
            const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 2) {
              return true;
            }
          }
          
          // For "last week" queries, prioritize memories from last 7 days
          if (queryLower.includes("last week")) {
            const entryDate = new Date(memory.timestamp);
            const now = new Date();
            const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
              return true;
            }
          }
        }
        
        return false;
      })
      .sort((a, b) => {
        // Enhanced sorting for time-based queries
        if (isTimeBasedQuery) {
          // Prioritize by recency for time-based queries
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        // Default sorting by recency
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
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