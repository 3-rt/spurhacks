# Stagehand Memory System

The Stagehand project now includes a comprehensive memory system that allows the AI agent to remember and recall previous actions, information, and context from past interactions.

## Features

### 🧠 Memory Types

- **Actions**: Remembered actions like orders, purchases, searches
- **Information**: Stored data like prices, URLs, extracted content
- **Preferences**: User preferences and settings
- **Context**: Background information and context

### 🔍 Smart Search

- Semantic search across memory entries
- Category-based filtering
- Tag-based organization
- Time-based relevance scoring

### 💾 Persistent Storage

- All memories stored in `stagehand-browser/memory.json`
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
User: "What was the price yesterday?"
System: Recalls previous price check, compares with current
```

### Scenario 2: Food Ordering

```
User: "Order pizza from Domino's"
System: Executes order, stores restaurant and order details
User: "Order the same dinner from last week"
System: Recalls previous order, repeats the action
```

### Scenario 3: Research Continuity

```
User: "Find information about AI trends"
System: Performs search, stores findings
User: "Show me more about the same topic"
System: Uses previous search context for follow-up
```

## Memory Management

### Viewing Memories

The system provides several ways to access memories:

- Search by keywords
- Filter by category
- View recent memories
- Get memory statistics

### Memory Structure

Each memory entry contains:

```json
{
  "id": "unique_identifier",
  "timestamp": "2024-01-01T12:00:00Z",
  "type": "action|information|preference|context",
  "category": "shopping|finance|search|communication|general",
  "description": "Human-readable description",
  "details": {
    "result": "Actual result data",
    "urls": ["visited_urls"],
    "extracted_info": "Key information"
  },
  "tags": ["relevant", "tags"],
  "relatedQueries": ["similar", "queries"]
}
```

## Technical Implementation

### Files

- `stagehand-browser/memory.ts`: Core memory system
- `memory-manager.js`: Electron integration
- `stagehand-browser/memory.json`: Persistent storage

### Integration Points

- **Stagehand Agent**: Enhanced with memory context
- **Electron App**: Memory management UI
- **IPC Handlers**: Communication between processes

### Memory Search Algorithm

The system uses a scoring algorithm that considers:

- Exact text matches (highest score)
- Category relevance
- Tag matches
- Related query similarity
- Time-based relevance
- Type-specific scoring

## Benefits

1. **Contextual Continuity**: Remember previous interactions
2. **Efficient Repetition**: Repeat actions without re-specification
3. **Information Recall**: Access previously found data
4. **Personalization**: Learn from user patterns
5. **Time-Saving**: Reduce redundant searches and actions

## Future Enhancements

- Memory expiration and cleanup
- Memory importance scoring
- Cross-device memory sync
- Memory visualization and analytics
- Advanced semantic search
- Memory-based learning and adaptation
