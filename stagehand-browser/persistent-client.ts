import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";

class PersistentStagehandClient {
  private stagehand: Stagehand | null = null;
  private page: Page | null = null;
  private context: BrowserContext | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {
      console.log(chalk.blue("🔄 Browser already initialized, reusing existing session"));
      return;
    }

    console.log(chalk.blue("🚀 Initializing persistent browser session..."));
    
    this.stagehand = new Stagehand({
      ...StagehandConfig,
    });
    
    await this.stagehand.init();
    this.page = this.stagehand.page;
    this.context = this.stagehand.context;
    this.isInitialized = true;
    
    console.log(chalk.green("✅ Browser session initialized and ready for use"));
  }

  async executeQuery(userQuery: string) {
    if (!this.isInitialized || !this.stagehand || !this.page || !this.context) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      console.log(chalk.blue(`🎬 Executing query: "${userQuery}"`));
      
      // Create a single web agent that can handle any task
      const agent = this.stagehand.agent({
        instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.
You can navigate to any website, search for information, find images, videos, links, or any other content.
When the user asks to save links, extract and clearly present all relevant URLs.
Be thorough and complete the entire task from start to finish.
Do not ask the user for any information, just use the browser to complete the task.`,
      });

      // Execute the user's query with the agent
      const result = await agent.execute(userQuery);
      
      console.log(chalk.yellow("🤖 Agent Result:"));
      console.log(result);
      
      // Take a screenshot of the final results
      await this.page.screenshot({ 
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

  async close() {
    if (this.stagehand && this.isInitialized) {
      console.log(chalk.blue("🔄 Closing browser session..."));
      await this.stagehand.close();
      this.stagehand = null;
      this.page = null;
      this.context = null;
      this.isInitialized = false;
      console.log(chalk.green("✅ Browser session closed"));
    }
  }

  isReady() {
    return this.isInitialized;
  }

  getPage() {
    return this.page;
  }

  getContext() {
    return this.context;
  }
}

// Create a singleton instance
const persistentClient = new PersistentStagehandClient();

// Export the singleton instance
export default persistentClient;

// For backward compatibility, also export the class
export { PersistentStagehandClient }; 