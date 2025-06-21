const fs = require('fs').promises;
const path = require('path');

class MemoryManager {
  constructor(memoryFilePath = path.join(__dirname, 'public', 'memory.json')) {
    this.memoryFilePath = memoryFilePath;
    // Common stop words to ignore in word matching
    this.stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'it', 'its', 'it\'s', 'he', 'him', 'his',
      'she', 'her', 'hers', 'they', 'them', 'their', 'theirs', 'we', 'us', 'our',
      'you', 'your', 'yours', 'i', 'me', 'my', 'mine', 'this', 'that', 'these', 'those',
      'here', 'there', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom',
      'and', 'or', 'but', 'if', 'then', 'else', 'because', 'since', 'as', 'while',
      'for', 'to', 'in', 'on', 'at', 'by', 'with', 'without', 'from', 'of', 'off',
      'up', 'down', 'out', 'over', 'under', 'between', 'among', 'through', 'during',
      'before', 'after', 'until', 'till', 'about', 'against', 'into', 'onto', 'upon'
    ]);
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
   * Extract meaningful words from text (excluding stop words)
   */
  extractWords(text) {
    if (!text) return [];
    
    // Convert to lowercase and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // Filter out stop words and short words
    return words.filter(word => 
      word.length > 2 && 
      !this.stopWords.has(word) &&
      !this.stopWords.has(word.replace(/['"]/g, '')) // Handle words with quotes
    );
  }

  /**
   * Calculate word overlap between query and memory
   */
  calculateWordOverlap(queryWords, memoryWords) {
    const querySet = new Set(queryWords);
    const memorySet = new Set(memoryWords);
    
    let overlap = 0;
    for (const word of querySet) {
      if (memorySet.has(word)) {
        overlap++;
      }
    }
    
    return overlap;
  }

  /**
   * Get all text content from a memory entry
   */
  getMemoryText(memory) {
    const texts = [];
    
    // Add description
    if (memory.description) {
      texts.push(memory.description);
    }
    
    // Add category
    if (memory.category) {
      texts.push(memory.category);
    }
    
    // Add tags
    if (memory.tags && Array.isArray(memory.tags)) {
      texts.push(...memory.tags);
    }
    
    // Add related queries
    if (memory.relatedQueries && Array.isArray(memory.relatedQueries)) {
      texts.push(...memory.relatedQueries);
    }
    
    // Add details if they exist
    if (memory.details) {
      if (typeof memory.details === 'string') {
        texts.push(memory.details);
      } else if (typeof memory.details === 'object') {
        // Extract string values from details object
        const extractStrings = (obj) => {
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
              texts.push(value);
            } else if (Array.isArray(value)) {
              value.forEach(item => {
                if (typeof item === 'string') {
                  texts.push(item);
                }
              });
            } else if (typeof value === 'object' && value !== null) {
              extractStrings(value);
            }
          }
        };
        extractStrings(memory.details);
      }
    }
    
    return texts.join(' ');
  }

  /**
   * Search memories by query using word overlap
   */
  async searchMemories(query, limit = 5) {
    const memories = await this.getAllMemories();
    const queryWords = this.extractWords(query);
    
    console.log(`🔍 Query words: [${queryWords.join(', ')}]`);
    
    if (queryWords.length === 0) {
      console.log('⚠️ No meaningful words found in query');
      return [];
    }
    
    // Score each memory based on word overlap
    const scoredMemories = memories.map(memory => {
      const memoryText = this.getMemoryText(memory);
      const memoryWords = this.extractWords(memoryText);
      const overlap = this.calculateWordOverlap(queryWords, memoryWords);
      
      return {
        memory,
        overlap,
        memoryWords,
        score: overlap / queryWords.length // Normalize by query length
      };
    });
    
    // Filter memories with any overlap and sort by score
    const relevantMemories = scoredMemories
      .filter(item => item.overlap > 0)
      .sort((a, b) => {
        // Primary sort by overlap score
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary sort by recency
        return new Date(b.memory.timestamp) - new Date(a.memory.timestamp);
      })
      .slice(0, limit)
      .map(item => item.memory);
    
    console.log(`📚 Found ${relevantMemories.length} relevant memories with word overlap`);
    
    // Log the top matches for debugging
    if (relevantMemories.length > 0) {
      console.log('🎯 Top matches:');
      relevantMemories.slice(0, 3).forEach((memory, index) => {
        const memoryWords = this.extractWords(this.getMemoryText(memory));
        const overlap = this.calculateWordOverlap(queryWords, memoryWords);
        console.log(`  ${index + 1}. "${memory.description}" (${overlap} word overlap)`);
      });
    }
    
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
   * Enhance query using relevant memories
   */
  async enhanceQueryWithMemories(userQuery, relevantMemories = []) {
    if (relevantMemories.length === 0) {
      console.log('No relevant memories found for enhancement');
      return userQuery;
    }

    // Check if Google API key is available for Gemini enhancement
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        return await this.enhanceQueryWithGemini(userQuery, relevantMemories);
      } catch (error) {
        console.log('Gemini enhancement failed, using simple enhancement:', error.message);
      }
    }

    // Simple enhancement based on most relevant memory
    const mostRelevant = relevantMemories[0];
    if (mostRelevant) {
      console.log(`🎯 Using memory for enhancement: "${mostRelevant.description}"`);
      
      // Extract specific details that might be useful
      let enhancedQuery = userQuery;
      
      if (mostRelevant.details) {
        // Handle stock symbols
        if (mostRelevant.details.stock_symbol) {
          enhancedQuery = enhancedQuery.replace(/same stock|that stock/gi, mostRelevant.details.stock_symbol);
        }
        
        // Handle restaurant names
        if (mostRelevant.details.restaurant) {
          enhancedQuery = enhancedQuery.replace(/same restaurant|that restaurant/gi, mostRelevant.details.restaurant);
        }
        
        // Handle product categories
        if (mostRelevant.details.product_category) {
          enhancedQuery = enhancedQuery.replace(/same product|that product/gi, mostRelevant.details.product_category);
        }
      }
      
      // Handle time-based references
      if (userQuery.toLowerCase().includes('yesterday') && mostRelevant.category === 'finance') {
        enhancedQuery = enhancedQuery.replace(/yesterday/gi, 'recent');
      }
      
      if (enhancedQuery !== userQuery) {
        console.log(`✨ Enhanced query: "${userQuery}" → "${enhancedQuery}"`);
        return enhancedQuery;
      }
    }
    
    return userQuery;
  }

  /**
   * Enhance query using Gemini AI based on relevant memories
   */
  async enhanceQueryWithGemini(userQuery, relevantMemories = []) {
    try {
      // Import Google Generative AI (lazy import to avoid dependency issues)
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Prepare memory context for Gemini
      const memoryContext = relevantMemories.map(memory => {
        const date = new Date(memory.timestamp).toLocaleDateString();
        let context = `📅 ${date}: ${memory.description}`;
        
        // Add specific details that might be useful
        if (memory.details) {
          if (memory.details.stock_symbol) {
            context += ` (Stock: ${memory.details.stock_symbol})`;
          }
          if (memory.details.restaurant) {
            context += ` (Restaurant: ${memory.details.restaurant})`;
          }
          if (memory.details.product_category) {
            context += ` (Product: ${memory.details.product_category})`;
          }
        }
        
        return context;
      }).join('\n');

      const prompt = `
You are a query enhancement system. Given a user query and relevant past memories, create an enhanced query that incorporates specific details from the memories.

USER QUERY: "${userQuery}"

RELEVANT MEMORIES:
${memoryContext}

INSTRUCTIONS:
1. If the user refers to "same", "yesterday", "last week", or similar time references, use the memory context to understand what they mean
2. Replace vague references with specific details from memories
3. Keep the enhanced query natural and actionable
4. If no relevant memories, return the original query unchanged
5. Focus on the most recent and relevant memory if multiple exist

Examples:
- "Check the same stock" + memory of NVDA → "Check NVDA stock price"
- "Order the same food" + memory of Domino's → "Order from Domino's"
- "Find that restaurant" + memory of Panda Express → "Find Panda Express"

ENHANCED QUERY:`;

      const result = await model.generateContent(prompt);
      const enhancedQuery = result.response.text().trim();
      
      console.log(`🤖 Gemini enhanced query: "${enhancedQuery}"`);
      return enhancedQuery;
      
    } catch (error) {
      console.log('Gemini enhancement failed, returning original query:', error.message);
      return userQuery;
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