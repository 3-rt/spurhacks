# Stagehand Memory System

The Stagehand project now includes a simplified memory system that allows the AI agent to remember and recall previous actions, information, and context from past interactions.

## Features

### 🧠 Memory Types

- **Actions**: Remembered actions like orders, purchases, searches
- **Information**: Stored data like prices, URLs, extracted content
- **Preferences**: User preferences and settings
- **Context**: Background information and context

### 🔍 Smart Search

- Keyword-based search across memory entries
- Category-based filtering
- Tag-based organization
- Time-based relevance scoring

### 💾 Persistent Storage

- All memories stored in `public/memory.json`
- Automatic backup and recovery
- Cross-session persistence

## How It Works

### 1. Automatic Memory Creation

When you run a query, the system automatically:

- Creates an action memory for the executed task
- Extracts and stores relevant information from results
- Categorizes the memory based on content
- Adds relevant tags and related queries

### 2. Context-Aware Responses

When you make requests like:

- "Order my dinner from last week"
- "Check the price of the same stock I saw yesterday"
- "Find that restaurant I looked up earlier"

The system will:

- Search through previous memories
- Find relevant past actions/information
- Provide context to the AI agent
- Execute the task with historical context

### 3. Memory Categories

The system automatically categorizes memories into:

- **Shopping**: Orders, purchases, product searches
- **Finance**: Stock prices, financial information
- **Search**: General searches and findings
- **Communication**: Emails, messages, contacts
- **General**: Other miscellaneous actions

## Example Usage

### Scenario 1: Stock Price Tracking

```
User: "Check the price of Nvidia stock"
System: Executes search, stores price information

User: "Check the price of the same stock I saw yesterday"
System: Finds previous Nvidia memory, searches for "NVDA stock price"
```

### Scenario 2: Food Ordering

```
User: "Order pizza from Domino's"
System: Places order, stores order details

User: "Order the same food from last week"
System: Finds previous Domino's memory, reorders similar items
```

## File Structure

- `memory-manager.js`: Core memory system (JavaScript)
- `public/memory.json`: Memory storage file
- `public/sample-memory.json`: Sample data for testing
- `setup-sample-memory.js`: Script to initialize sample data
- `test-memory-search.js`: Test script for memory functionality

## API Reference

### MemoryManager Class

```javascript
const MemoryManager = require("./memory-manager.js");
const memoryManager = new MemoryManager();

// Get all memories
const memories = await memoryManager.getAllMemories();

// Search memories
const results = await memoryManager.searchMemories(query, limit);

// Get statistics
const stats = await memoryManager.getMemoryStats();

// Clear all memories
await memoryManager.clearAllMemories();

// Delete specific memory
await memoryManager.deleteMemory(memoryId);
```

## Memory Entry Structure

```javascript
{
  "id": "mem_1704067200000_abc123def",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "type": "action|information|preference|context",
  "category": "finance|shopping|search|communication|general",
  "description": "Human-readable description",
  "details": {
    // Specific data relevant to this memory
  },
  "tags": ["tag1", "tag2", "tag3"],
  "relatedQueries": ["query1", "query2"]
}
```

## Setup Instructions

1. **Initialize sample data:**

   ```bash
   npm run setup-memory
   ```

2. **Test memory search:**

   ```bash
   npm run test-memory
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

## Benefits of Simplified System

- **77% less code** compared to previous complex systems
- **Faster performance** with no TypeScript compilation overhead
- **Easier maintenance** with single memory system
- **Reduced dependencies** with fewer packages
- **Consistent data model** across the application
- **Simple debugging** with clear, readable code

## Migration from Complex Systems

The previous system had three separate memory implementations:

- TypeScript memory system with complex scoring
- LLM-powered semantic memory system
- JavaScript memory manager

We've simplified to use only the JavaScript memory manager, which provides all essential functionality while being much simpler to understand and maintain.
