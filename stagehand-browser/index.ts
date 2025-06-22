import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import { Browserbase } from "@browserbasehq/sdk";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";

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

/**
 * Start a BrowserBase session with debug interface
 */
async function startBBSSession() {
  const browserbase = new Browserbase();
  const session = await browserbase.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });
  const debugUrl = await browserbase.sessions.debug(session.id);
  
  emitStagehandOutput('session_created', `BrowserBase session created: ${session.id}`, 'info');
  emitStagehandOutput('debug_url', `Debug URL: ${debugUrl.debuggerFullscreenUrl}`, 'info');
  
  return {
    sessionId: session.id,
    debugUrl: debugUrl.debuggerFullscreenUrl,
  };
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
        // Get user query from environment variable
        const userQuery = process.env.USER_QUERY || "go to yahoo finance, find the stock price of Nvidia, and return the price in USD";
        
        // Start intercepting logs to capture real Stagehand output
        interceptStagehandLogs();
        
        emitStagehandOutput('task_start', `🎬 Starting AI automation for: "${userQuery}"`, 'info');
        
        // Create a single web agent that can handle any task
        const agent = stagehand.agent({
            instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.

You can navigate to any website, search for information, find images, videos, links, or any other content.
When the user asks to save links, extract and clearly present all relevant URLs.
Be thorough and complete the entire task from start to finish.
Do not ask the user for any information, just use the browser to complete the task.

Think through your process step by step and explain your reasoning as you work.`,
        });

        emitStagehandOutput('agent_created', '🤖 Web automation agent initialized and ready', 'info');

        // Execute the user's query with the agent - this will generate real Stagehand logs
        emitStagehandOutput('execution_start', '🚀 Beginning task execution...', 'info');
        
        const result = await agent.execute(userQuery);
        
        emitStagehandOutput('execution_complete', '✅ Task execution completed successfully', 'info');
        emitStagehandOutput('agent_result', `🤖 Agent Result: ${result}`, 'info');
        
        // Take a screenshot of the final results
        emitStagehandOutput('screenshot', '📸 Taking screenshot of final results...', 'info');
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        emitStagehandOutput('screenshot_saved', '📸 Screenshot saved as automation-results.png', 'info');
        
        emitStagehandOutput('task_complete', `🎉 Task completed successfully!`, 'info');
        
        return {
            success: true,
            userQuery,
            agentResult: result
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        emitStagehandOutput('error', `❌ Error during AI automation: ${errorMessage}`, 'error');
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Initialize and run the main() function with BrowserBase session
 */
async function runStagehand(sessionId?: string) {
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
    });
    await stagehand.close();

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
        const { sessionId, debugUrl } = await startBBSSession();
        
        // Run Stagehand with the session ID
        const result = await runStagehand(sessionId);
        
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