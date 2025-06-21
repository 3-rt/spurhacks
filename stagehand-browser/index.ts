import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";
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

// Function to emit COT events to the frontend
function emitCOTEvent(type: string, content: string, step?: number, details?: any) {
  const event = {
    type: "cot",
    data: {
      type,
      content,
      step,
      details,
      timestamp: new Date().toISOString()
    }
  };
  
  // Send to stdout for Electron to capture
  console.log(JSON.stringify(event));
}

// Enhanced agent with COT logging and memory context
async function createCOTAgent(stagehand: Stagehand, memoryContext: string = "", enhancedQuery: string = "") {
  const agent = stagehand.agent({
    instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.

🧠 MEMORY SYSTEM: You have access to previous actions and information. The memory system finds relevant past actions based on word overlap with your current request.

MEMORY CONTEXT:${memoryContext}

IMPORTANT INSTRUCTIONS:
1. Use the memory context to understand what the user is referring to when they mention "same", "yesterday", "last week", "previous", or similar references
2. If the memory shows specific details (names, symbols, locations, etc.), use those specific details in your search
3. Always prioritize specific information from memory over generic searches
4. If the user says "same" and memory shows specific details, use those details to make the search more specific
5. If the user says "yesterday" or "last week", look at the memory context for what was done then
6. Use the enhanced query if it's different from the original, otherwise use the original query but apply the memory context

ORIGINAL QUERY: "${process.env.USER_QUERY || ''}"
ENHANCED QUERY: "${enhancedQuery}"

IMPORTANT: You must think through your process step by step and explain your reasoning as you go. Use the following format for your thinking:

1. First, analyze the user's request and break it down into clear steps
2. Plan your approach and identify what websites or tools you'll need
3. Execute each step methodically, explaining what you're doing and why
4. Handle any errors or unexpected situations gracefully
5. Present your final results clearly

You can navigate to any website, search for information, find images, videos, links, or any other content.
When the user asks to save links, extract and clearly present all relevant URLs.
Be thorough and complete the entire task from start to finish.
Do not ask the user for any information, just use the browser to complete the task.

Always think aloud and explain your reasoning process as you work.

When you complete actions, make sure to extract and remember important details like:
- URLs visited
- Information found (prices, names, etc.)
- Actions taken (orders placed, searches performed, etc.)
- Any relevant context that might be useful for future requests`,
  });

  // Override the execute method to add COT logging
  const originalExecute = agent.execute.bind(agent);
  
  agent.execute = async (instructionOrOptions: string | any) => {
    const query = typeof instructionOrOptions === 'string' ? instructionOrOptions : instructionOrOptions.instruction || '';
    
    emitCOTEvent("thinking_start", `Starting to think about: "${query}"`, 1);
    
    try {
      // Emit thinking events during execution
      emitCOTEvent("analyzing_request", `Breaking down the request into manageable steps`, 2);
      
      // Add a small delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      emitCOTEvent("planning_approach", `Planning the best approach to complete this task`, 3);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      emitCOTEvent("executing_steps", `Beginning step-by-step execution`, 4);
      
      // Execute the original method
      const result = await originalExecute(instructionOrOptions);
      
      emitCOTEvent("execution_success", `Successfully completed all steps`, 5);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      emitCOTEvent("execution_error", `Error during execution: ${errorMessage}`, -1);
      throw error;
    }
  };

  return agent;
}

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
                
                // Extract any useful details from the memory dynamically
                if (memory.details && typeof memory.details === 'object') {
                    // Add any key-value pairs from details that might be useful
                    const usefulDetails = Object.entries(memory.details)
                        .filter(([key, value]) => {
                            // Skip internal fields and focus on user-relevant information
                            const skipKeys = ['timestamp', 'success', 'source', 'result'];
                            return !skipKeys.includes(key) && value && typeof value === 'string' && value.length > 0;
                        })
                        .map(([key, value]) => `   ${key}: ${value}`)
                        .join('\n');
                    
                    if (usefulDetails) {
                        memoryContext += usefulDetails + '\n';
                    }
                }
                memoryContext += "\n";
            }
            
            console.log(chalk.cyan(memoryContext));
            console.log(chalk.green(`🔄 Enhanced query: "${enhancedQuery}"`));
        } else {
            console.log(chalk.yellow("🧠 No relevant memories found for this query"));
        }
        
        // Emit initial COT event
        emitCOTEvent("task_start", `Starting AI automation for: "${userQuery}"`, 1);
        
        // Create a single web agent that can handle any task with enhanced COT instructions and memory context
        const agent = await createCOTAgent(stagehand, memoryContext, enhancedQuery);

        // Emit COT event for agent creation
        emitCOTEvent("agent_created", "Web automation agent initialized and ready to execute task", 2);

        // Execute the enhanced query with the agent
        emitCOTEvent("execution_start", "Beginning task execution with step-by-step reasoning", 3);
        
        const result = await agent.execute(enhancedQuery);
        
        // Emit completion COT event
        emitCOTEvent("execution_complete", "Task execution completed successfully", 4);
        
        console.log(chalk.yellow("🤖 Agent Result:"));
        console.log(result);
        
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
        emitCOTEvent("screenshot", "Taking screenshot of final results", 5);
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        // Display memory statistics
        const stats = await memoryManager.getMemoryStats();
        console.log(chalk.cyan(`📊 Memory Stats: ${stats.total} total entries`));
        
        // Emit final COT event
        emitCOTEvent("task_complete", `Task completed successfully. Result: ${result}`, 6);
        
        return {
            success: true,
            userQuery,
            agentResult: result,
            memoryContext: relevantMemories.length > 0 ? relevantMemories : null,
            enhancedQuery
        };
        
    } catch (error) {
        console.error(chalk.red("❌ Error during AI automation:"), error);
        
        // Emit error COT event
        emitCOTEvent("error", `Error during AI automation: ${error instanceof Error ? error.message : String(error)}`, -1);
        
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