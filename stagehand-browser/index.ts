import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";

import chalk from "chalk";
import boxen from "boxen";
import persistentClient from "./persistent-client.js";
import path from "path";
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the JavaScript memory manager with proper ES module handling
const require = createRequire(import.meta.url);
const MemoryManager = require("../memory-manager.js");

/**
 * 🤘 Welcome to Stagehand! Thanks so much for trying us out!
 * 🛠️ CONFIGURATION: stagehand.config.ts will help you configure Stagehand
 *
 * 📝 Check out our docs for more fun use cases, like building agents
 * https://docs.stagehand.dev/
 *
 * 💬 If you have any feedback, reach out to us on Slack!
 * https://stagehand.dev/slack
 *
 * 📚 You might also benefit from the docs for Zod, Browserbase, and Playwright:
 * - https://zod.dev/
 * - https://docs.browserbase.com/
 * - https://playwright.dev/docs/intro
 */
async function main({
    userQuery,
    page,
    context,
    stagehand,
    memoryManager,
}: {
    userQuery: string; // The user's query
    page: Page; // Playwright Page with act, extract, and observe methods
    context: BrowserContext; // Playwright BrowserContext
    stagehand: Stagehand; // Stagehand instance
}) {
    try {
        
        // Initialize the persistent client if not already initialized
        await persistentClient.initialize();
        // Initialize memory system
        const memoryManager = new MemoryManager();
        
        // Get user query from environment variable
        
        const userQuery = process.env.USER_QUERY || "go to yahoo finance, find the stock price of Nvidia, and return the price in USD";
    
        console.log(chalk.blue(`🎬 Starting AI automation for: "${userQuery}"`));
        
        // Search for relevant memories before executing
        const relevantMemories = await memoryManager.searchMemories(userQuery, 3);
        let memoryContext = "";
        let enhancedQuery = userQuery;
        
        if (relevantMemories.length > 0) {
            console.log(chalk.cyan(`🧠 Found ${relevantMemories.length} relevant memories with word overlap:`));
            
            // Use the new memory-based enhancement
            enhancedQuery = await memoryManager.enhanceQueryWithMemories(userQuery, relevantMemories);
            
            // Create a simple memory context
            memoryContext = "\n\n🧠 MEMORY CONTEXT - Previous actions that match your request:\n";
            
            for (const memory of relevantMemories) {
                const date = new Date(memory.timestamp).toLocaleDateString();
                memoryContext += `📅 ${date}: ${memory.description}\n`;
                
                // Extract specific details that are useful for the agent
                if (memory.details) {
                    if (memory.details.stock_symbol) {
                        memoryContext += `   Stock Symbol: ${memory.details.stock_symbol}\n`;
                    }
                    if (memory.details.company_name) {
                        memoryContext += `   Company: ${memory.details.company_name}\n`;
                    }
                    if (memory.details.restaurant) {
                        memoryContext += `   Restaurant: ${memory.details.restaurant}\n`;
                    }
                    if (memory.details.cuisine_type) {
                        memoryContext += `   Cuisine: ${memory.details.cuisine_type}\n`;
                    }
                    if (memory.details.product_category) {
                        memoryContext += `   Product: ${memory.details.product_category}\n`;
                    }
                    if (memory.details.topic) {
                        memoryContext += `   Topic: ${memory.details.topic}\n`;
                    }
                    // Add any other useful details from the memory
                    if (memory.details.extractedInfo) {
                        memoryContext += `   Info: ${memory.details.extractedInfo}\n`;
                    }
                }
                memoryContext += "\n";
            }
            
            console.log(chalk.cyan(memoryContext));
            console.log(chalk.green(`🔄 Enhanced query: "${enhancedQuery}"`));
        } else {
            console.log(chalk.yellow("🧠 No relevant memories found for this query"));
        }
        
        // Create a single web agent that can handle any task with memory context
        const agent = stagehand.agent({
            instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.
You can navigate to any website, search for information, find images, videos, links, or any other content.
When the user asks to save links, extract and clearly present all relevant URLs.
Be thorough and complete the entire task from start to finish.
Do not ask the user for any information, just use the browser to complete the task.

🧠 MEMORY SYSTEM: You have access to previous actions and information. The memory system finds relevant past actions based on word overlap with your current request.

MEMORY CONTEXT:${memoryContext}

IMPORTANT INSTRUCTIONS:
1. Use the memory context to understand what the user is referring to when they mention "same", "yesterday", "last week", or similar references
2. If the memory shows specific details (stock symbols, restaurant names, product categories), use those specific details in your search
3. Always prioritize specific information from memory over generic searches
4. If the user says "same stock" and memory shows a specific stock symbol, search for that symbol
5. If the user says "same restaurant" and memory shows a restaurant name, search for that restaurant
6. If the user says "yesterday" or "last week", look at the memory context for what was done then
7. Use the enhanced query if it's different from the original, otherwise use the original query but apply the memory context

ORIGINAL QUERY: "${userQuery}"
ENHANCED QUERY: "${enhancedQuery}"

When you complete actions, make sure to extract and remember important details like:
- URLs visited
- Information found (prices, names, etc.)
- Actions taken (orders placed, searches performed, etc.)
- Any relevant context that might be useful for future requests`,
        });

        // Execute the enhanced query with the agent
        // const result = await agent.execute(enhancedQuery);
        
        // Execute the user's query
        const result = await persistentClient.executeQuery(enhancedQuery);
        
        // Extract and store important information in memory
        try {
            // Create a simple memory entry for this action
            const actionMemory = {
                type: "action",
                category: "general",
                description: `Executed: ${enhancedQuery}`,
                details: {
                    result: result,
                    timestamp: new Date().toISOString(),
                    success: true
                },
                tags: ["action", "execution"],
                relatedQueries: [enhancedQuery]
            };
            
            // Add to memory using the simple method
            const allMemories = await memoryManager.getAllMemories();
            const newMemory = {
                id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                ...actionMemory
            };
            
            // Read current memory file using proper ES module path
            const fs = require('fs').promises;
            const memoryPath = path.join(__dirname, '..', 'public', 'memory.json');
            let memoryData;
            try {
                const data = await fs.readFile(memoryPath, 'utf-8');
                memoryData = JSON.parse(data);
            } catch (error) {
                memoryData = {
                    entries: [],
                    lastUpdated: new Date().toISOString(),
                    version: "1.0.0"
                };
            }
            
            memoryData.entries.push(newMemory);
            memoryData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
            console.log(chalk.blue(`💾 Memory saved: ${actionMemory.description}`));
            
            // If the result contains specific information, store it separately
            const resultString = String(result || '');
            if (resultString.length > 0) {
                const infoMemory = {
                    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                    type: "information",
                    category: "general",
                    description: `Information from: ${enhancedQuery}`,
                    details: {
                        extractedInfo: resultString,
                        source: "agent_execution",
                        timestamp: new Date().toISOString()
                    },
                    tags: ["information", "extracted"],
                    relatedQueries: [enhancedQuery]
                };
                
                memoryData.entries.push(infoMemory);
                await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
            }
            
        } catch (memoryError) {
            console.error(chalk.red("❌ Error saving to memory:"), memoryError);
            console.error(chalk.red("❌ Error details:"), memoryError instanceof Error ? memoryError.message : String(memoryError));
            console.error(chalk.red("❌ Error stack:"), memoryError instanceof Error ? memoryError.stack : 'No stack trace');
        }
        
        // Take a screenshot of the final results
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        // Display memory statistics
        const stats = await memoryManager.getMemoryStats();
        
        console.log(chalk.cyan(`📊 Memory Stats: ${stats.total} total entries`));
        
        return {
            success: true,
            userQuery,
            agentResult: result,
            memoryContext: relevantMemories.length > 0 ? relevantMemories : null,
            enhancedQuery
        };
        
    } catch (error) {
        console.error(chalk.red("❌ Error in main function:"), error instanceof Error ? error.message : String(error));
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            userQuery: process.env.USER_QUERY || "unknown"
        };
    }
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
    // Get user query from environment variable
    const userQuery = process.env.USER_QUERY || "go to yahoo finance, find the stock price of Nvidia, and return the price in USD";
    
    const result = await main(userQuery);
    
    // Don't close the browser - keep it open for future use
    console.log(chalk.green("✅ Browser session kept open for future use"));
    
    return result;
}

// Export for use in Electron
export { run as runStagehand, persistentClient };

// Run the app
run();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow("\n🔄 Shutting down gracefully..."));
    await persistentClient.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow("\n🔄 Shutting down gracefully..."));
    await persistentClient.close();
    process.exit(0);
});

// test test 