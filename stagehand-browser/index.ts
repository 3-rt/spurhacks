import chalk from "chalk";
import boxen from "boxen";
import persistentClient from "./persistent-client.js";

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
async function main(userQuery: string) {
    try {
        console.log(chalk.blue(`🎬 Starting AI automation for: "${userQuery}"`));
        
        // Initialize the persistent client if not already initialized
        await persistentClient.initialize();
        
        // Execute the user's query
        const result = await persistentClient.executeQuery(userQuery);
        
        return result;
        
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