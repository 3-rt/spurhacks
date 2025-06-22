import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import { Browserbase } from "@browserbasehq/sdk";
import StagehandConfig from "./stagehand.config.js";
import SessionManager from "./sessionManager.js";
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

// Function to emit real Stagehand output to the frontend
function emitStagehandOutput(type: string, content: string, level: string = 'info') {
  const event = {
    type: "stagehand-output",
    data: {
      type,
      content,
      level,
      timestamp: new Date().toISOString()
    }
  };
  
  // Send to stdout for Electron to capture
  console.log(JSON.stringify(event));
}
// Intercept console logs to capture Stagehand's real output
function interceptStagehandLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
  
    console.log = (...args) => {
      const message = args.join(' ');
      
      // Skip our own JSON events
      if (!message.startsWith('{"type":')) {
        // Parse Stagehand-specific logs
        if (message.includes('INFO:') || message.includes('action:') || message.includes('reasoning:')) {
          emitStagehandOutput('agent_action', message, 'info');
        } else if (message.includes('ERROR:') || message.includes('error')) {
          emitStagehandOutput('agent_error', message, 'error');
        } else if (message.includes('DEBUG:') || message.includes('debug')) {
          emitStagehandOutput('agent_debug', message, 'debug');
        } else if (message.includes('modelName:') || message.includes('llm')) {
          emitStagehandOutput('agent_llm', message, 'info');
        } else {
          emitStagehandOutput('agent_general', message, 'info');
        }
      }
      
      // Call original log
      originalLog.apply(console, args);
    };
  
    console.error = (...args) => {
      const message = args.join(' ');
      if (!message.startsWith('{"type":')) {
        emitStagehandOutput('agent_error', message, 'error');
      }
      originalError.apply(console, args);
    };
  
    console.warn = (...args) => {
      const message = args.join(' ');
      if (!message.startsWith('{"type":')) {
        emitStagehandOutput('agent_warning', message, 'warn');
      }
      originalWarn.apply(console, args);
    };
  
    console.info = (...args) => {
      const message = args.join(' ');
      if (!message.startsWith('{"type":')) {
        emitStagehandOutput('agent_info', message, 'info');
      }
      originalInfo.apply(console, args);
    };
  
}

// Enhanced agent with COT logging
async function createCOTAgent(stagehand: Stagehand, memoryContext: string = "", enhancedQuery: string = "", personalInfoContext: string = "") {
  const agent = stagehand.agent({
    instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.
    🧠 MEMORY SYSTEM: You have access to previous actions and information. The memory system finds relevant past actions based on word overlap with your current request.
    MEMORY CONTEXT:${memoryContext}
    ${personalInfoContext}
    IMPORTANT INSTRUCTIONS:
    1.  Always consult the MEMORY CONTEXT to understand the user's intent, especially if the query is short, ambiguous, or seems to refer to past activities. The memory provides valuable context about previous tasks.
    2.  When memory provides specific details (like names, companies, locations, URLs), prioritize using those details to make your actions more precise. For example, use a specific company name from memory instead of a generic search.
    3.  When the MEMORY CONTEXT is relevant, always use the PERSONAL INFO CONTEXT as well, especially for tasks involving personal details or preferences.
    4.  Use the ENHANCED QUERY if it provides a clearer goal. Otherwise, use the ORIGINAL QUERY but enrich it with insights from the memory and personal info contexts.
    5.  When navigating websites, be thorough. Use scrolling (up and down) to explore all content, find information, and reveal lazy-loaded elements.
    6.  When dealing with forms:
        - Identify and fill in ALL required fields.
        - Use information from the PERSONAL INFO CONTEXT to complete the form accurately.
        - After filling all necessary fields, locate and click the 'submit', 'continue', 'next', or similarly-named button to complete the submission.
    7.  Use common web navigation actions like clicking buttons, links, and interactive elements, using search bars, and handling popups or modals.
    ORIGINAL QUERY: "${process.env.USER_QUERY || ''}"
    ENHANCED QUERY: "${enhancedQuery}"
    IMPORTANT: You must think through your process step by step and explain your reasoning as you go. Use the following format for your thinking:
    1. First, analyze the user's request and break it down into clear steps
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
    
    // emitStagehandOutput("thinking_start", `Starting to think about: "${query}"`, "info");
    
    try {
      // Emit thinking events during execution
    //   emitStagehandOutput("analyzing_request", `Breaking down the request into manageable steps`, "info");
      
      // Add a small delay to simulate thinking
    //   await new Promise(resolve => setTimeout(resolve, 1000));
      
    //   emitStagehandOutput("planning_approach", `Planning the best approach to complete this task`, "info");
      
    //   await new Promise(resolve => setTimeout(resolve, 800));
      
    //   emitStagehandOutput("executing_steps", `Beginning step-by-step execution`, "info");
      
      // Execute the original method
      const result = await originalExecute(instructionOrOptions);
      
      emitStagehandOutput("execution_success", `Successfully completed all steps`, "info");
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      emitStagehandOutput("execution_error", `Error during execution: ${errorMessage}`, "error");
      throw error;
    }
  };

  return agent;
}

/**
 * Start a BrowserBase session with debug interface
 */
async function startBBSSession() {
  const sessionManager = new SessionManager();
  const { sessionId, isFirstTimeEver } = await sessionManager.getOrCreateSession();
  
  const browserbase = new Browserbase();
  const debugUrl = await browserbase.sessions.debug(sessionId);
  
  // Check if this is a new session or existing one
  const isNewSession = !sessionManager.getCurrentSessionId() || sessionManager.getCurrentSessionId() === sessionId;
  
  if (isNewSession) {
    emitStagehandOutput('session_created', `BrowserBase session created: ${sessionId}`, 'info');
  } else {
    emitStagehandOutput('session_reused', `BrowserBase session reused: ${sessionId}`, 'info');
  }
  
  emitStagehandOutput('debug_url', `Debug URL: ${debugUrl.debuggerFullscreenUrl}`, 'info');
  
  return {
    sessionId: sessionId,
    debugUrl: debugUrl.debuggerFullscreenUrl,
    isFirstTimeEver: isFirstTimeEver,
  };
}

async function main({
    page,
    context,
    stagehand,
    isFirstTimeEver,
}: {
    page: Page; // Playwright Page with act, extract, and observe methods
    context: BrowserContext; // Playwright BrowserContext
    stagehand: Stagehand; // Stagehand instance
    isFirstTimeEver: boolean;
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
        let personalInfoContext = "";
        
        if (relevantMemories.length > 0) {
            console.log(chalk.cyan(`🧠 Found ${relevantMemories.length} relevant memories with word overlap:`));
            
            // Use the memory-based enhancement
            const enhancementResult = await memoryManager.enhanceQueryWithMemories(userQuery, relevantMemories);
            
            // Handle the new response format
            if (typeof enhancementResult === 'string') {
                // Backward compatibility with old format
                enhancedQuery = enhancementResult;
            } else if (enhancementResult && typeof enhancementResult === 'object') {
                // New format with enhancedQuery and personalInfo
                enhancedQuery = enhancementResult.enhancedQuery || userQuery;
                
                // Log personal information if any was extracted
                if (enhancementResult.personalInfo && Object.keys(enhancementResult.personalInfo).length > 0) {
                    console.log(chalk.green(`👤 Personal information extracted:`, enhancementResult.personalInfo));
                }
            }
            
            // Create memory context for the agent
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
        
        // Get personal information context
        personalInfoContext = await memoryManager.getPersonalInfoContext();
        if (personalInfoContext) {
            console.log(chalk.blue(`👤 Personal profile context loaded`));
        }
        
        interceptStagehandLogs();
        
        // emitStagehandOutput('task_start', `🎬 Starting AI automation for: "${userQuery}"`, 'info');
        
        // Create a single web agent that can handle any task with enhanced COT instructions and memory context
        const agent = await createCOTAgent(stagehand, memoryContext, enhancedQuery, personalInfoContext);

        // Emit COT event for agent creation
        // emitStagehandOutput("agent_created", "Web automation agent initialized and ready to execute task", "info");

        // Execute the enhanced query with the agent - this will generate real Stagehand logs
        // emitStagehandOutput('execution_start', '🚀 Beginning task execution...', 'info');
        
        // Only navigate to DuckDuckGo if this is the first time ever
        if (isFirstTimeEver) {
            emitStagehandOutput('first_time_setup', '🌐 Initializing browser with DuckDuckGo...', 'info');
            await page.goto("https://duckduckgo.com");
        } else {
            emitStagehandOutput('session_continuation', '🔄 Continuing from previous session...', 'info');
        }

        const systemPrompt = `
        ONLY use duckduckgo.com as a search engine, NEVER use google.com or any other search engine.
        always try to end the task in a website and not a search result/search engine.
        `
        const result = await agent.execute(systemPrompt + enhancedQuery);
        
        // Emit completion COT event
        emitStagehandOutput("execution_complete", "Task execution completed successfully", "info");
        
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
            
            // Add to memory using the memory manager
            await memoryManager.addMemory(actionMemory);
            console.log(chalk.blue(`💾 Memory saved: ${actionMemory.description}`));
            
            // If the result contains specific information, store it separately
            const resultString = String(result || '');
            if (resultString.length > 0) {
                const infoMemory = {
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
                
                await memoryManager.addMemory(infoMemory);
                console.log(chalk.blue(`💾 Information memory saved: ${infoMemory.description}`));
            }
            
        } catch (memoryError) {
            console.error(chalk.red("❌ Error saving to memory:"), memoryError);
            console.error(chalk.red("❌ Error details:"), memoryError instanceof Error ? memoryError.message : String(memoryError));
            console.error(chalk.red("❌ Error stack:"), memoryError instanceof Error ? memoryError.stack : 'No stack trace');
        }
        
        // Take a screenshot of the final results
        emitStagehandOutput('screenshot', '📸 Taking screenshot of final results...', 'info');
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        emitStagehandOutput('screenshot_saved', '📸 Screenshot saved as automation-results.png', 'info');
        
        // Display memory statistics
        const stats = await memoryManager.getMemoryStats();
        console.log(chalk.cyan(`📊 Memory Stats: ${stats.total} total entries`));
        
        emitStagehandOutput('task_complete', `🎉 Task completed successfully!`, 'info');
        
        return {
            success: true,
            userQuery,
            agentResult: result,
            memoryContext: relevantMemories.length > 0 ? relevantMemories : null,
            enhancedQuery
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        emitStagehandOutput('error', `❌ Error during AI automation: ${errorMessage}`, 'error');
        
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            userQuery: process.env.USER_QUERY || "unknown"
        };
    }
}

/**
 * Initialize and run the main() function with BrowserBase session
 */
async function runStagehand(sessionId?: string, isFirstTimeEver: boolean = false) {
    const stagehand = new Stagehand({
        ...StagehandConfig,
        browserbaseSessionID: sessionId,
    });
    await stagehand.init();

    const page = stagehand.page;
    const context = stagehand.context;
    const result = await main({
        page,
        context,
        stagehand,
        isFirstTimeEver,
    });
    // await stagehand.close();

    return result;
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
    try {
        // Start a BrowserBase session with debug interface
        const { sessionId, debugUrl, isFirstTimeEver } = await startBBSSession();
        
        // Run Stagehand with the session ID
        const result = await runStagehand(sessionId, isFirstTimeEver);
        
        return result;
    } catch (error) {
        console.error('Error in run function:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// Export for use in Electron
export { run as runStagehand, startBBSSession };

// Run the app
run();

// test test 