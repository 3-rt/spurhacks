import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
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

// Enhanced agent with COT logging
async function createCOTAgent(stagehand: Stagehand) {
  const agent = stagehand.agent({
    instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.

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

Always think aloud and explain your reasoning process as you work.`,
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
        // Get user query from environment variable
        const userQuery = process.env.USER_QUERY || "go to yahoo finance, find the stock price of Nvidia, and return the price in USD";
        
        console.log(chalk.blue(`🎬 Starting AI automation for: "${userQuery}"`));
        
        // Emit initial COT event
        emitCOTEvent("task_start", `Starting AI automation for: "${userQuery}"`, 1);
        
        // Create a single web agent that can handle any task with enhanced COT instructions
        const agent = await createCOTAgent(stagehand);

        // Emit COT event for agent creation
        emitCOTEvent("agent_created", "Web automation agent initialized and ready to execute task", 2);

        // Execute the user's query with the agent
        emitCOTEvent("execution_start", "Beginning task execution with step-by-step reasoning", 3);
        
        const result = await agent.execute(userQuery);
        
        // Emit completion COT event
        emitCOTEvent("execution_complete", "Task execution completed successfully", 4);
        
        console.log(chalk.yellow("🤖 Agent Result:"));
        console.log(result);
        
        // Take a screenshot of the final results
        emitCOTEvent("screenshot", "Taking screenshot of final results", 5);
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        // Emit final COT event
        emitCOTEvent("task_complete", `Task completed successfully. Result: ${result}`, 6);
        
        return {
            success: true,
            userQuery,
            agentResult: result
        };
        
    } catch (error) {
        console.error(chalk.red("❌ Error during AI automation:"), error);
        
        // Emit error COT event
        emitCOTEvent("error", `Error during AI automation: ${error instanceof Error ? error.message : String(error)}`, -1);
        
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