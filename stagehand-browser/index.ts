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
        
        // Create a single web agent that can handle any task
        const agent = stagehand.agent({
            instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.\nYou can navigate to any website, search for information, find images, videos, links, or any other content.\nWhen the user asks to save links, extract and clearly present all relevant URLs.\nBe thorough and complete the entire task from start to finish.\nDo not ask the user for any information, just use the browser to complete the task.`,
        });

        // Execute the user's query with the agent
        const result = await agent.execute(userQuery);
        
        console.log(chalk.yellow("🤖 Agent Result:"));
        console.log(result);
        
        // Take a screenshot of the final results
        await page.screenshot({ 
            path: "automation-results.png",
            fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        return {
            success: true,
            userQuery,
            agentResult: result
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
