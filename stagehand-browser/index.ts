import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";
import { MemoryManager, MemoryHelpers } from "./memory.js";

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
    page,
    context,
    stagehand,
}: {
    page: Page; // Playwright Page with act, extract, and observe methods
    context: BrowserContext; // Playwright BrowserContext
    stagehand: Stagehand; // Stagehand instance
}) {
    try {
        // Initialize memory system
        const memoryManager = new MemoryManager();
        await memoryManager.initialize();
        
        // Get user query from environment variable
        const userQuery = process.env.USER_QUERY || "go to yahoo finance, find the stock price of Nvidia, and return the price in USD";
        
        console.log(chalk.blue(`🎬 Starting AI automation for: "${userQuery}"`));
        
        // Search for relevant memories before executing
        const relevantMemories = await memoryManager.searchMemories(userQuery, 3);
        let memoryContext = "";
        let enhancedQuery = userQuery;
        
        if (relevantMemories.length > 0) {
            console.log(chalk.cyan(`🧠 Found ${relevantMemories.length} relevant memories:`));
            
            // Create a more direct memory context
            memoryContext = "\n\n🧠 MEMORY CONTEXT - Previous actions that match your request:\n";
            
            for (const memory of relevantMemories) {
                const date = new Date(memory.timestamp).toLocaleDateString();
                memoryContext += `📅 ${date}: ${memory.description}\n`;
                
                // Extract specific details that are useful for the agent
                if (memory.details) {
                    if (memory.details.stock_symbol) {
                        memoryContext += `   Stock Symbol: ${memory.details.stock_symbol}\n`;
                        // Directly enhance the query with the stock symbol
                        if (userQuery.toLowerCase().includes("same stock") || 
                            userQuery.toLowerCase().includes("yesterday") ||
                            userQuery.toLowerCase().includes("stock") && userQuery.toLowerCase().includes("same")) {
                            enhancedQuery = userQuery.replace(/same stock|yesterday|the same stock/gi, `${memory.details.stock_symbol} stock`);
                        }
                    }
                    if (memory.details.company_name) {
                        memoryContext += `   Company: ${memory.details.company_name}\n`;
                    }
                    if (memory.details.restaurant_chain) {
                        memoryContext += `   Restaurant: ${memory.details.restaurant_chain}\n`;
                        // Directly enhance food queries
                        if (userQuery.toLowerCase().includes("same food") || 
                            userQuery.toLowerCase().includes("dinner") || 
                            userQuery.toLowerCase().includes("last week") ||
                            userQuery.toLowerCase().includes("same restaurant")) {
                            enhancedQuery = userQuery.replace(/same food|dinner from last week|same restaurant/gi, `food from ${memory.details.restaurant_chain}`);
                        }
                    }
                    if (memory.details.cuisine_type) {
                        memoryContext += `   Cuisine: ${memory.details.cuisine_type}\n`;
                    }
                    if (memory.details.product_category) {
                        memoryContext += `   Product: ${memory.details.product_category}\n`;
                        // Enhance product searches
                        if (userQuery.toLowerCase().includes("same product") || 
                            userQuery.toLowerCase().includes("same headphones") ||
                            userQuery.toLowerCase().includes("same laptop")) {
                            enhancedQuery = userQuery.replace(/same product|same headphones|same laptop/gi, `${memory.details.product_category}`);
                        }
                    }
                    if (memory.details.topic) {
                        memoryContext += `   Topic: ${memory.details.topic}\n`;
                        // Enhance research queries
                        if (userQuery.toLowerCase().includes("same topic") || 
                            userQuery.toLowerCase().includes("same research")) {
                            enhancedQuery = userQuery.replace(/same topic|same research/gi, `${memory.details.topic}`);
                        }
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

🧠 MEMORY SYSTEM: You have access to previous actions and information. When the user refers to "same", "yesterday", "last week", or similar time references, use the memory context to understand what they mean.

MEMORY CONTEXT:${memoryContext}

IMPORTANT INSTRUCTIONS:
1. If the memory context shows a stock symbol (like NVDA), use that specific symbol in your search
2. If the memory context shows a restaurant name, use that specific restaurant
3. If the memory context shows a product category, focus on that category
4. Always prioritize the specific details from memory over generic searches
5. If the user says "same stock" and memory shows NVDA, search for "NVDA stock price"
6. If the user says "same food" and memory shows Domino's, search for "Domino's pizza"
7. If the user says "yesterday" or "last week", look at the memory context for what was done then

ORIGINAL QUERY: "${userQuery}"
ENHANCED QUERY: "${enhancedQuery}"

Use the enhanced query if it's different from the original, otherwise use the original query but apply the memory context.

When you complete actions, make sure to extract and remember important details like:
- URLs visited
- Information found (prices, names, etc.)
- Actions taken (orders placed, searches performed, etc.)
- Any relevant context that might be useful for future requests`,
        });

        // Execute the enhanced query with the agent
        const result = await agent.execute(enhancedQuery);
        
        console.log(chalk.yellow("🤖 Agent Result:"));
        console.log(result);
        
        // Extract and store important information in memory
        try {
            // Create memory entry for this action
            const actionMemory = MemoryHelpers.createActionMemory(
                `Executed: ${enhancedQuery}`,
                {
                    result: result,
                    timestamp: new Date().toISOString(),
                    success: true
                },
                enhancedQuery
            );
            
            await memoryManager.addMemory(actionMemory);
            
            // If the result contains specific information (like prices, URLs, etc.), store it separately
            const resultString = String(result || '');
            if (resultString.length > 0) {
                // Try to extract specific information from the result
                const infoMemory = MemoryHelpers.createInformationMemory(
                    `Information from: ${enhancedQuery}`,
                    {
                        extractedInfo: resultString,
                        source: "agent_execution",
                        timestamp: new Date().toISOString()
                    },
                    enhancedQuery
                );
                
                await memoryManager.addMemory(infoMemory);
            }
            
        } catch (memoryError) {
            console.error(chalk.red("❌ Error saving to memory:"), memoryError);
        }
        
        // Take a screenshot of the final results
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        // Display memory statistics
        const stats = memoryManager.getMemoryStats();
        console.log(chalk.cyan(`📊 Memory Stats: ${stats.total} total entries`));
        
        return {
            success: true,
            userQuery,
            agentResult: result,
            memoryContext: relevantMemories.length > 0 ? relevantMemories : null,
            memoryStats: stats
        };
        
    } catch (error) {
        console.error(chalk.red("❌ Error during AI automation:"), error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
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
    const stagehand = new Stagehand({
        ...StagehandConfig,
    });
    await stagehand.init();

    const page = stagehand.page;
    const context = stagehand.context;
    const result = await main({
        page,
        context,
        stagehand,
    });
    await stagehand.close();

    return result;
}

// Export for use in Electron
export { run as runStagehand };

// Run the app
run();

// test test 