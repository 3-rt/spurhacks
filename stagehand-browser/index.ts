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
    console.log(chalk.blue("🎬 Starting YouTube video finder with Gemini 2.0 Flash..."));
    
    // Navigate to YouTube using the page object
    await page.goto("https://www.youtube.com");
    console.log(chalk.green("✓ Navigated to YouTube"));
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    console.log(chalk.green("✓ Page loaded successfully"));
    
    // Use Gemini AI to find and interact with videos
    const searchResult = await page.act(
      "Go to YouTube and find a popular video. Look for trending videos or videos with high view counts. Click on one of the videos to watch it. Extract the video title, channel name, and view count.",
      {
        modelName: "google/gemini-2.0-flash",
        modelClientOptions: {
          apiKey: process.env.GOOGLE_API_KEY,
        },
      }
    );
    
    console.log(chalk.yellow("🤖 Gemini AI Response:"));
    console.log(searchResult);
    
    // Extract video information
    const videoInfo = await page.extract({
      title: "string",
      channel: "string", 
      views: "string",
      description: "string",
      url: "string"
    });
    
    console.log(chalk.green("📹 Video Information:"));
    console.log(boxen(
      `Title: ${videoInfo.title}\nChannel: ${videoInfo.channel}\nViews: ${videoInfo.views}\nURL: ${videoInfo.url}`,
      {
        title: "Found Video",
        padding: 1,
        margin: 1,
        borderStyle: "round"
      }
    ));
    
    // Take a screenshot of the video
    await page.screenshot({ 
      path: "youtube-video.png",
      fullPage: false 
    });
    console.log(chalk.green("📸 Screenshot saved as youtube-video.png"));
    
    // Wait a bit to show the video is playing
    await page.waitForTimeout(5000);
    
    // Get more detailed information about the video
    const detailedInfo = await page.act(
      "Analyze the current video page. Look for the video description, comments section, and related videos. Extract any interesting details about the video content.",
      {
        modelName: "google/gemini-2.0-flash",
        modelClientOptions: {
          apiKey: process.env.GOOGLE_API_KEY,
        },
      }
    );
    
    console.log(chalk.yellow("🔍 Detailed Analysis:"));
    console.log(detailedInfo);
    
    return {
      success: true,
      videoInfo,
      aiResponse: searchResult,
      detailedAnalysis: detailedInfo
    };
    
  } catch (error) {
    console.error(chalk.red("❌ Error during YouTube automation:"), error);
    return {
      success: false,
      error: error.message
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

  if (StagehandConfig.env === "BROWSERBASE" && stagehand.browserbaseSessionID) {
    console.log(
      boxen(
        `View this session live in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`,
        )}`,
        {
          title: "Browserbase",
          padding: 1,
          margin: 3,
        },
      ),
    );
  }

  const page = stagehand.page;
  const context = stagehand.context;
  const result = await main({
    page,
    context,
    stagehand,
  });
  await stagehand.close();
  
  stagehand.log({
    category: "create-browser-app",
    message: `\n🤘 Thanks so much for using Stagehand! Reach out to us on Slack if you have any feedback: ${chalk.blue(
      "https://stagehand.dev/slack",
    )}\n`,
  });
  
  return result;
}

// Export for use in Electron
export { run as runStagehand };

// Run the app
run();
