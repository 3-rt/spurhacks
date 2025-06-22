const fs = require('fs').promises;
const path = require('path');
const PersonalProfileManager = require('./personal-profile-manager.js');

class MemoryManager {
  constructor(memoryFilePath = null) {
    this.memoryFilePath = memoryFilePath || path.join(__dirname, 'public', 'memory.json');
    this.personalProfileManager = new PersonalProfileManager();
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
   * Add a new memory
   */
  async addMemory(memory) {
    try {
      const memories = await this.getAllMemories();
      
      const newMemory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: memory.type || 'action',
        category: memory.category || 'general',
        description: memory.description,
        details: memory.details || {},
        tags: memory.tags || [],
        relatedQueries: memory.relatedQueries || [],
        ...memory
      };

      memories.push(newMemory);
      
      // Save to file
      await fs.writeFile(this.memoryFilePath, JSON.stringify({
        entries: memories,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }, null, 2));
      
      console.log(`🧠 Added memory: ${newMemory.description}`);
      return newMemory;
    } catch (error) {
      console.error('❌ Error adding memory:', error);
      throw error;
    }
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
        // Handle any type of details dynamically
        const detailKeys = Object.keys(mostRelevant.details);
        for (const key of detailKeys) {
          const value = mostRelevant.details[key];
          if (typeof value === 'string' && value.length > 0) {
            // Create patterns to replace based on the detail type
            const patterns = [
              `same ${key}`,
              `that ${key}`,
              `the ${key}`,
              key
            ];
            
            for (const pattern of patterns) {
              if (userQuery.toLowerCase().includes(pattern.toLowerCase())) {
                enhancedQuery = enhancedQuery.replace(new RegExp(pattern, 'gi'), value);
                break;
              }
            }
          }
        }
      }
      
      // Handle time-based references
      if (userQuery.toLowerCase().includes('yesterday')) {
        enhancedQuery = enhancedQuery.replace(/yesterday/gi, 'recent');
      }
      
      if (userQuery.toLowerCase().includes('last week')) {
        enhancedQuery = enhancedQuery.replace(/last week/gi, 'recent');
      }
      
      if (userQuery.toLowerCase().includes('previous')) {
        enhancedQuery = enhancedQuery.replace(/previous/gi, 'recent');
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
        
        // Add any details that might be useful
        if (memory.details && typeof memory.details === 'object') {
          const usefulDetails = Object.entries(memory.details)
            .filter(([key, value]) => {
              const skipKeys = ['timestamp', 'success', 'source', 'result'];
              return !skipKeys.includes(key) && value && typeof value === 'string' && value.length > 0;
            })
            .map(([key, value]) => ` (${key}: ${value})`)
            .join('');
          
          if (usefulDetails) {
            context += usefulDetails;
          }
        }
        
        return context;
      }).join('\n');

      const prompt = `
You are a query enhancement and personal information extraction system. Given a user query and relevant past memories, you need to:

1. Create an enhanced query that incorporates specific details from the memories
2. Extract any personal information mentioned in the query

USER QUERY: "${userQuery}"

RELEVANT MEMORIES:
${memoryContext}

INSTRUCTIONS:
1. If the user refers to "same", "yesterday", "last week", "previous", or similar time references, use the memory context to understand what they mean
2. Replace vague references with specific details from memories
3. Keep the enhanced query natural and actionable
4. If no relevant memories, return the original query unchanged
5. Focus on the most recent and relevant memory if multiple exist
6. Use any details from the memory context to make the query more specific

PERSONAL INFORMATION EXTRACTION:
Extract any personal information mentioned in the query such as:
- Names (first name, last name, full name)
- Email addresses
- Phone numbers
- Addresses
- Birth dates
- Preferences (food, music, etc.)
- Any other personal details

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object in this exact format:
{
  "enhancedQuery": "the enhanced query string",
  "personalInfo": {
    "datum1": "value1",
    "datum2": "value2"
  }
}

Examples:
- "My name is John Smith" → {"enhancedQuery": "My name is John Smith", "personalInfo": {"firstName": "John", "lastName": "Smith"}}
- "Check the same stock" + memory of NVDA → {"enhancedQuery": "Check NVDA stock price", "personalInfo": {}}
- "I like pizza" → {"enhancedQuery": "I like pizza", "personalInfo": {"foodPreference": "pizza"}}

IMPORTANT: Only include personal information that is explicitly mentioned or can be reasonably inferred. If no personal information is found, use an empty object for personalInfo.

RESPONSE:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Try to parse the JSON response
      let parsedResponse;
      try {
        // Handle markdown-wrapped JSON responses
        let jsonText = responseText;
        if (responseText.includes('```json')) {
          jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        parsedResponse = JSON.parse(jsonText);
      } catch (parseError) {
        console.log('Failed to parse Gemini response as JSON, using fallback:', parseError.message);
        // Fallback: treat the entire response as enhanced query
        parsedResponse = {
          enhancedQuery: responseText,
          personalInfo: {}
        };
      }

      // Validate the response structure
      if (!parsedResponse.enhancedQuery) {
        parsedResponse.enhancedQuery = userQuery;
      }
      if (!parsedResponse.personalInfo || typeof parsedResponse.personalInfo !== 'object') {
        parsedResponse.personalInfo = {};
      }

      console.log(`🤖 Gemini enhanced query: "${parsedResponse.enhancedQuery}"`);
      console.log(`👤 Extracted personal info:`, parsedResponse.personalInfo);

      // Save personal information to profile if any was found
      if (Object.keys(parsedResponse.personalInfo).length > 0) {
        try {
          await this.personalProfileManager.updateProfile(parsedResponse.personalInfo);
          console.log(`💾 Personal information saved to profile`);
        } catch (profileError) {
          console.error('❌ Error saving personal information:', profileError);
        }
      }

      return parsedResponse;
      
    } catch (error) {
      console.log('Gemini enhancement failed, returning original query:', error.message);
      return {
        enhancedQuery: userQuery,
        personalInfo: {}
      };
    }
  }

  /**
   * Delete a specific memory
   */
  async deleteMemory(memoryId) {
    try {
      const memories = await this.getAllMemories();
      
      const index = memories.findIndex(entry => entry.id === memoryId);
      if (index === -1) {
        return { success: false, error: 'Memory not found' };
      }
      
      memories.splice(index, 1);
      
      await fs.writeFile(this.memoryFilePath, JSON.stringify({
        entries: memories,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }, null, 2));
      
      return { success: true, message: 'Memory deleted' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a memory
   */
  async updateMemory(id, updates) {
    try {
      const memories = await this.getAllMemories();
      const index = memories.findIndex(memory => memory.id === id);
      
      if (index !== -1) {
        memories[index] = { ...memories[index], ...updates };
        
        await fs.writeFile(this.memoryFilePath, JSON.stringify({
          entries: memories,
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        }, null, 2));
        
        console.log(`🔄 Updated memory: ${memories[index].description}`);
        return memories[index];
      }
      return null;
    } catch (error) {
      console.error('❌ Error updating memory:', error);
      return null;
    }
  }

  /**
   * Get memories by category
   */
  async getMemoriesByCategory(category) {
    const memories = await this.getAllMemories();
    return memories.filter(memory => memory.category === category);
  }

  /**
   * Get memories by tag
   */
  async getMemoriesByTag(tag) {
    const memories = await this.getAllMemories();
    return memories.filter(memory => memory.tags.includes(tag));
  }

  /**
   * Get memories by type
   */
  async getMemoriesByType(type) {
    const memories = await this.getAllMemories();
    return memories.filter(memory => memory.type === type);
  }

  /**
   * Get memory by ID
   */
  async getMemoryById(id) {
    const memories = await this.getAllMemories();
    return memories.find(memory => memory.id === id);
  }

  /**
   * Search memories by specific detail
   */
  async searchMemoriesByDetail(detailKey, detailValue) {
    const memories = await this.getAllMemories();
    return memories.filter(memory => 
      memory.details && memory.details[detailKey] === detailValue
    );
  }

  /**
   * Export memories to file
   */
  async exportMemories(exportPath) {
    try {
      const memories = await this.getAllMemories();
      const exportData = {
        entries: memories,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      };
      
      await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`📤 Exported ${memories.length} memories to ${exportPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error exporting memories:', error);
      return false;
    }
  }

  /**
   * Import memories from file
   */
  async importMemories(importPath) {
    try {
      const data = await fs.readFile(importPath, 'utf-8');
      const importedMemories = JSON.parse(data);
      
      if (importedMemories.entries && Array.isArray(importedMemories.entries)) {
        const currentMemories = await this.getAllMemories();
        currentMemories.push(...importedMemories.entries);
        
        await fs.writeFile(this.memoryFilePath, JSON.stringify({
          entries: currentMemories,
          lastUpdated: new Date().toISOString(),
          version: "1.0.0"
        }, null, 2));
        
        console.log(`📥 Imported ${importedMemories.entries.length} memories from ${importPath}`);
        return true;
      } else {
        console.error('❌ Invalid memory file format');
        return false;
      }
    } catch (error) {
      console.error('❌ Error importing memories:', error);
      return false;
    }
  }

  /**
   * Get personal information context for agent instructions
   */
  async getPersonalInfoContext() {
    try {
      const profile = await this.personalProfileManager.getProfile();
      if (Object.keys(profile).length === 0) {
        return "";
      }

      let context = "\n\n👤 PERSONAL PROFILE - Information about the user:\n";
      for (const [key, value] of Object.entries(profile)) {
        context += `   ${key}: ${value}\n`;
      }
      return context;
    } catch (error) {
      console.error('❌ Error getting personal info context:', error);
      return "";
    }
  }

  /**
   * Get all personal information
   */
  async getPersonalInfo() {
    return await this.personalProfileManager.getAllPersonalInfo();
  }

  /**
   * Get personal profile statistics
   */
  async getPersonalProfileStats() {
    return await this.personalProfileManager.getProfileStats();
  }

  /**
   * Get a specific piece of personal information
   */
  async getPersonalInfoField(field) {
    return await this.personalProfileManager.getPersonalInfo(field);
  }

  /**
   * Update a specific personal information field
   */
  async updatePersonalInfoField(field, value) {
    const update = { [field]: value };
    return await this.personalProfileManager.updateProfile(update);
  }

  /**
   * Clear all personal information
   */
  async clearPersonalProfile() {
    return await this.personalProfileManager.clearProfile();
  }

  /**
   * Export personal profile to file
   */
  async exportPersonalProfile(exportPath) {
    return await this.personalProfileManager.exportProfile(exportPath);
  }

  /**
   * Import personal profile from file
   */
  async importPersonalProfile(importPath) {
    return await this.personalProfileManager.importProfile(importPath);
  }
}

module.exports = MemoryManager; 
