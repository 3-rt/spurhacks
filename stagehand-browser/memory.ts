import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

export interface MemoryEntry {
  id: string;
  timestamp: string;
  type: "action" | "information" | "preference" | "context";
  category: string;
  description: string;
  details: Record<string, any>;
  tags: string[];
  relatedQueries: string[];
}

export interface MemoryDatabase {
  entries: MemoryEntry[];
  lastUpdated: string;
  version: string;
}

export class MemoryManager {
  private memoryFilePath: string;
  private memory: MemoryDatabase;

  constructor(memoryFilePath: string = "../public/memory.json") {
    this.memoryFilePath = memoryFilePath;
    this.memory = {
      entries: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };
  }

  /**
   * Initialize the memory system by loading existing memory or creating new
   */
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.memoryFilePath, "utf-8");
      this.memory = JSON.parse(data);
      console.log(chalk.green(`📚 Memory loaded with ${this.memory.entries.length} entries`));
    } catch (error) {
      console.log(chalk.yellow("📚 Creating new memory database"));
      await this.saveMemory();
    }
  }

  /**
   * Save memory to JSON file
   */
  private async saveMemory(): Promise<void> {
    this.memory.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.memoryFilePath, JSON.stringify(this.memory, null, 2));
  }

  /**
   * Add a new memory entry
   */
  async addMemory(entry: Omit<MemoryEntry, "id" | "timestamp">): Promise<string> {
    const id = this.generateId();
    const memoryEntry: MemoryEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };

    this.memory.entries.push(memoryEntry);
    await this.saveMemory();
    
    console.log(chalk.blue(`💾 Memory saved: ${entry.description}`));
    return id;
  }

  /**
   * Search for relevant memories based on query
   */
  async searchMemories(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryLower = query.toLowerCase();
    const relevantMemories: Array<{ entry: MemoryEntry; score: number }> = [];

    // Check for time-based queries
    const isTimeBasedQuery = queryLower.includes("yesterday") || 
                            queryLower.includes("last week") || 
                            queryLower.includes("earlier") || 
                            queryLower.includes("same") ||
                            queryLower.includes("previous");

    for (const entry of this.memory.entries) {
      let score = 0;

      // Score based on description match
      if (entry.description.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      // Score based on category match
      if (entry.category.toLowerCase().includes(queryLower)) {
        score += 2;
      }

      // Score based on tags
      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 1;
        }
      }

      // Score based on related queries
      for (const relatedQuery of entry.relatedQueries) {
        if (relatedQuery.toLowerCase().includes(queryLower)) {
          score += 2;
        }
      }

      // Enhanced scoring for time-based queries
      if (isTimeBasedQuery) {
        // For "same stock" queries, prioritize stock-related memories
        if (queryLower.includes("stock") && entry.category === "finance") {
          score += 5;
        }
        
        // For "same food" queries, prioritize food-related memories
        if (queryLower.includes("food") || queryLower.includes("dinner") || queryLower.includes("lunch")) {
          if (entry.category === "shopping" && entry.details?.cuisine_type) {
            score += 5;
          }
        }
        
        // For "same restaurant" queries, prioritize restaurant memories
        if (queryLower.includes("restaurant") && entry.details?.restaurant_chain) {
          score += 5;
        }
        
        // For "yesterday" queries, prioritize recent memories (within last 2 days)
        if (queryLower.includes("yesterday")) {
          const entryDate = new Date(entry.timestamp);
          const now = new Date();
          const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 2) {
            score += 3;
          }
        }
        
        // For "last week" queries, prioritize memories from last 7 days
        if (queryLower.includes("last week")) {
          const entryDate = new Date(entry.timestamp);
          const now = new Date();
          const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 7) {
            score += 2;
          }
        }
      }

      // Score based on type relevance
      if (queryLower.includes("order") || queryLower.includes("buy") || queryLower.includes("purchase")) {
        if (entry.type === "action") score += 1;
      }
      if (queryLower.includes("price") || queryLower.includes("cost") || queryLower.includes("value")) {
        if (entry.type === "information") score += 1;
      }

      // Additional scoring for specific patterns
      if (queryLower.includes("stock") && entry.details?.stock_symbol) {
        score += 3;
      }
      if (queryLower.includes("pizza") && entry.details?.cuisine_type === "pizza") {
        score += 3;
      }
      if (queryLower.includes("chinese") && entry.details?.cuisine_type === "chinese") {
        score += 3;
      }

      if (score > 0) {
        relevantMemories.push({ entry, score });
      }
    }

    // Sort by score and return top results
    return relevantMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.entry);
  }

  /**
   * Get memories by type
   */
  async getMemoriesByType(type: MemoryEntry["type"], limit: number = 10): Promise<MemoryEntry[]> {
    return this.memory.entries
      .filter(entry => entry.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get memories by category
   */
  async getMemoriesByCategory(category: string, limit: number = 10): Promise<MemoryEntry[]> {
    return this.memory.entries
      .filter(entry => entry.category.toLowerCase().includes(category.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get recent memories
   */
  async getRecentMemories(limit: number = 10): Promise<MemoryEntry[]> {
    return this.memory.entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Update an existing memory entry
   */
  async updateMemory(id: string, updates: Partial<MemoryEntry>): Promise<boolean> {
    const index = this.memory.entries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.memory.entries[index] = { ...this.memory.entries[index], ...updates };
    await this.saveMemory();
    return true;
  }

  /**
   * Delete a memory entry
   */
  async deleteMemory(id: string): Promise<boolean> {
    const index = this.memory.entries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.memory.entries.splice(index, 1);
    await this.saveMemory();
    return true;
  }

  /**
   * Generate a unique ID for memory entries
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): { total: number; byType: Record<string, number>; byCategory: Record<string, number> } {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const entry of this.memory.entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    }

    return {
      total: this.memory.entries.length,
      byType,
      byCategory
    };
  }

  /**
   * Clear all memories
   */
  async clearAllMemories(): Promise<void> {
    this.memory.entries = [];
    await this.saveMemory();
    console.log(chalk.yellow("🗑️ All memories cleared"));
  }
}

// Helper functions for common memory operations
export const MemoryHelpers = {
  /**
   * Extract relevant information from a user query for memory storage
   */
  extractQueryInfo(query: string): {
    category: string;
    tags: string[];
    relatedQueries: string[];
  } {
    const queryLower = query.toLowerCase();
    let category = "general";
    const tags: string[] = [];
    const relatedQueries: string[] = [];

    // Categorize based on content
    if (queryLower.includes("order") || queryLower.includes("buy") || queryLower.includes("purchase")) {
      category = "shopping";
      tags.push("purchase", "order");
    } else if (queryLower.includes("price") || queryLower.includes("stock") || queryLower.includes("finance")) {
      category = "finance";
      tags.push("price", "stock", "finance");
    } else if (queryLower.includes("search") || queryLower.includes("find")) {
      category = "search";
      tags.push("search", "find");
    } else if (queryLower.includes("email") || queryLower.includes("gmail")) {
      category = "communication";
      tags.push("email", "communication");
    }

    // Extract time references
    if (queryLower.includes("yesterday")) {
      tags.push("yesterday", "past");
      relatedQueries.push("same as yesterday", "like yesterday");
    } else if (queryLower.includes("last week")) {
      tags.push("last-week", "past");
      relatedQueries.push("same as last week", "like last week");
    } else if (queryLower.includes("same")) {
      tags.push("repeat", "same");
    }

    return { category, tags, relatedQueries };
  },

  /**
   * Create a memory entry for an action
   */
  createActionMemory(description: string, details: Record<string, any>, query: string): Omit<MemoryEntry, "id" | "timestamp"> {
    const { category, tags, relatedQueries } = this.extractQueryInfo(query);
    
    return {
      type: "action",
      category,
      description,
      details,
      tags: [...tags, "action"],
      relatedQueries: [...relatedQueries, query]
    };
  },

  /**
   * Create a memory entry for information
   */
  createInformationMemory(description: string, details: Record<string, any>, query: string): Omit<MemoryEntry, "id" | "timestamp"> {
    const { category, tags, relatedQueries } = this.extractQueryInfo(query);
    
    return {
      type: "information",
      category,
      description,
      details,
      tags: [...tags, "information"],
      relatedQueries: [...relatedQueries, query]
    };
  }
}; 