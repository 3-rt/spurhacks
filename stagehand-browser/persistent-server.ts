import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import { createServer } from "http";
import { parse } from "url";

class PersistentStagehandServer {
  private stagehand: Stagehand | null = null;
  private page: Page | null = null;
  private context: BrowserContext | null = null;
  private isInitialized = false;
  private server: any = null;
  private port = 3001;

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
    
    // Start HTTP server for communication
    await this.startServer();
  }

  private async startServer() {
    this.server = createServer(async (req, res) => {
      const { pathname, query } = parse(req.url || '', true);
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (pathname === '/execute' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const { query: userQuery } = JSON.parse(body);
            
            // Set up SSE connection for streaming
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            });
            
            // Send initial connection message
            res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Streaming started' })}\n\n`);
            
            // Execute query with streaming updates
            await this.executeQueryWithStreaming(userQuery, res);
            
            res.end();
            
          } catch (error) {
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
              }));
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : String(error) })}\n\n`);
              res.end();
            }
          }
        });
      } else if (pathname === '/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          isReady: this.isInitialized 
        }));
      } else if (pathname === '/close' && req.method === 'POST') {
        await this.close();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Browser closed' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    return new Promise<void>((resolve, reject) => {
      this.server.listen(this.port, () => {
        console.log(chalk.green(`🌐 Server listening on port ${this.port}`));
        resolve();
      });
      
      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(chalk.yellow(`⚠️  Port ${this.port} is in use, trying ${this.port + 1}`));
          this.port++;
          this.server.listen(this.port);
        } else {
          reject(error);
        }
      });
    });
  }

  private async executeQueryWithStreaming(userQuery: string, res: any) {
    if (!this.isInitialized || !this.stagehand || !this.page || !this.context) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      console.log(chalk.blue(`🎬 Executing query: "${userQuery}"`));
      
      // Send start message
      this.sendStreamUpdate(res, { type: 'start', message: `Starting execution: ${userQuery}` });
      
      // Capture all console output
      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        const message = args.join(' ');
        originalLog(...args);
        this.sendStreamUpdate(res, { type: 'output', data: message });
      };

      console.info = (...args) => {
        const message = args.join(' ');
        originalInfo(...args);
        this.sendStreamUpdate(res, { type: 'output', data: message });
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        originalWarn(...args);
        this.sendStreamUpdate(res, { type: 'output', data: message });
      };

      console.error = (...args) => {
        const message = args.join(' ');
        originalError(...args);
        this.sendStreamUpdate(res, { type: 'error', data: message });
      };

      try {
        // Custom agent implementation that streams actions in real-time
        const result = await this.executeCustomAgent(userQuery, res);
        
        // Restore original console methods
        console.log = originalLog;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
        
        // Take a screenshot of the final results
        await this.page.screenshot({ 
          path: "automation-results.png",
          fullPage: false 
        });
        console.log(chalk.green("📸 Screenshot saved as automation-results.png"));
        
        // Send completion message
        this.sendStreamUpdate(res, { 
          type: 'complete', 
          success: true,
          result: {
            success: true,
            userQuery,
            agentResult: result
          }
        });
        
        return {
          success: true,
          userQuery,
          agentResult: result
        };
        
      } catch (executionError) {
        // Restore original console methods
        console.log = originalLog;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
        
        throw executionError;
      }
      
    } catch (error) {
      console.error(chalk.red("❌ Error during AI automation:"), error);
      
      // Send error message
      this.sendStreamUpdate(res, { 
        type: 'complete', 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeCustomAgent(userQuery: string, res: any) {
    if (!this.stagehand || !this.page) {
      throw new Error("Stagehand not initialized");
    }

    const actions: any[] = [];
    let actionCounter = 0;

    // Helper function to add and stream an action
    const addAction = async (type: string, reasoning: string, parameters: any, taskCompleted: boolean = false) => {
      actionCounter++;
      const action = {
        type,
        reasoning,
        parameters,
        taskCompleted,
        timestamp: new Date().toISOString()
      };
      
      actions.push(action);
      
      // Stream the action immediately
      this.sendStreamUpdate(res, {
        type: 'action',
        data: {
          number: actionCounter,
          action: action
        }
      });
      
      // Add a small delay to make streaming visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return action;
    };

    try {
      // Add initial analysis action
      await addAction('analyze', 'Using AI-powered agent to execute query', userQuery);
      
      // Create a single web agent that can handle any task
      const agent = this.stagehand.agent({
        instructions: `You are a helpful web assistant that can use a browser to complete any task the user requests.
You can navigate to any website, search for information, find images, videos, links, or any other content.
When the user asks to save links, extract and clearly present all relevant URLs.
Be thorough and complete the entire task from start to finish.
Do not ask the user for any information, just use the browser to complete the task.
Provide clear, step-by-step updates as you work through the task.`,
      });

      // Execute the user's query with the agent
      await addAction('execute', 'Executing query with AI agent', userQuery);
      const result = await agent.execute(userQuery);
      
      // Mark as completed
      await addAction('complete', 'Task completed successfully', result, true);
      
      return {
        success: true,
        message: `Successfully executed: ${userQuery}`,
        actions: actions,
        completed: true,
        result: result
      };
      
    } catch (error) {
      await addAction('error', `Error occurred: ${error instanceof Error ? error.message : String(error)}`, null, false);
      throw error;
    }
  }

  private sendStreamUpdate(res: any, data: any) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      // Connection might be closed
      console.log("Failed to send stream update:", error);
    }
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
    if (this.server) {
      this.server.close();
      console.log(chalk.blue("🔄 HTTP server closed"));
    }
    
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

  getPort() {
    return this.port;
  }
}

// Create and export the server instance
const persistentServer = new PersistentStagehandServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow("\n🔄 Shutting down gracefully..."));
  await persistentServer.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow("\n🔄 Shutting down gracefully..."));
  await persistentServer.close();
  process.exit(0);
});

// Initialize the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  persistentServer.initialize().catch(console.error);
}

export default persistentServer;
export { PersistentStagehandServer };