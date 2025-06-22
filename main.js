const { app, BrowserWindow, ipcMain, screen, Menu, globalShortcut } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const fs = require("fs")
const os = require("os")
const Groq = require("groq-sdk")
const MemoryManager = require("./memory-manager.js")

// Import COT Enhancement Service (using dynamic import for ES modules)
let cotEnhancementService = null;

async function initializeCOTService() {
  try {
    const { default: service } = await import('./src/services/cotEnhancementService.js');
    cotEnhancementService = service;
    
    // Initialize the service asynchronously
    await cotEnhancementService.initialize();
    
    // Set up the emit function to send enhanced events to frontend
    cotEnhancementService.setEmitFunction((enhancedEvents) => {
      enhancedEvents.forEach(event => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("stagehand-stream", {
            type: "enhanced-cot",
            data: event,
            isComplete: false
          });
        }
      });
    });
    
    console.log("COT Enhancement Service initialized");
  } catch (error) {
    console.error("Failed to initialize COT Enhancement Service:", error);
  }
}

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, 'stagehand-browser', '.env') })

// Check if Groq API key is set
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY not set. Speech-to-text transcription will not work.')
  console.warn('   Run "npm run setup" to configure your API key or set the environment variable.')
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Make sure to set this environment variable
})

let mainWindow
let memoryManager = new MemoryManager()

function createWindow() {
  // Get screen size to position the window in top right
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  
  // Helper function to get the current display where the window is located
  const getCurrentDisplay = () => {
    try {
      const bounds = mainWindow.getBounds()
      return screen.getDisplayNearestPoint(bounds)
    } catch (error) {
      console.warn('Error getting current display, falling back to primary display:', error)
      return primaryDisplay
    }
  }
  
  mainWindow = new BrowserWindow({
    width: 80,
    height: 80,
    x: screenWidth - 100, // Position in top right
    y: 20,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,
    transparent: false,
    backgroundColor: '#111827',
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  // Handle window controls
  ipcMain.handle("window-minimize", () => {
    mainWindow.minimize()
  })

  ipcMain.handle("window-maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      // Get the current display where the window is located
      const currentDisplay = getCurrentDisplay()
      const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
      
      // Maximize to the current monitor's work area
      mainWindow.setBounds({
        x: currentDisplay.bounds.x,
        y: currentDisplay.bounds.y,
        width: screenWidth,
        height: screenHeight
      })
    }
  })

  ipcMain.handle("window-close", () => {
    mainWindow.close()
  })

  // Handle window expansion to fixed size on the right
  ipcMain.handle("expand-window", () => {
    // Get the current display where the window is located
    const currentDisplay = getCurrentDisplay()
    const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
    
    // Calculate window size based on fixed sidebar widths
    // Left sidebar: 320px (w-80)
    // Right sidebar: 384px (w-96)
    // Main content: minimum 600px for browser
    const leftSidebarWidth = 320
    const rightSidebarWidth = 384
    const mainContentWidth = Math.max(600, screenWidth * 0.4) // Minimum 600px for browser
    
    const windowWidth = Math.min(leftSidebarWidth + mainContentWidth + rightSidebarWidth, screenWidth * 0.95)
    const windowHeight = Math.min(700, screenHeight * 0.85)  // Cap at 700px or 85% of screen height
    
    // Center the window horizontally and vertically on the current monitor
    const x = currentDisplay.bounds.x + Math.floor((screenWidth - windowWidth) / 2)
    const y = currentDisplay.bounds.y + Math.floor((screenHeight - windowHeight) / 2)
    
    mainWindow.setBounds({
      x: x,
      y: y,
      width: windowWidth,
      height: windowHeight
    })
    
    // Ensure the window is not maximized to maintain our custom bounds
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    }
  })

  // Handle fullscreen toggle
  ipcMain.handle("toggle-fullscreen", () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false)
    } else {
      mainWindow.setFullScreen(true)
    }
  })

  // Handle window collapse
  ipcMain.handle("collapse-window", () => {
    // Get the current display where the window is located
    const currentDisplay = getCurrentDisplay()
    const { width: screenWidth } = currentDisplay.workAreaSize
    
    mainWindow.setBounds({
      x: currentDisplay.bounds.x + screenWidth - 100,
      y: currentDisplay.bounds.y + 20,
      width: 80,
      height: 80
    })
  })

  // Handle window dragging
  ipcMain.handle("set-window-position", (event, x, y) => {
    mainWindow.setPosition(x, y)
  })

  // Stagehand integration
  ipcMain.handle("initialize-stagehand", async () => {
    try {
      console.log("Initializing Stagehand service")
      // Check if stagehand-browser directory exists and has required files
      const stagehandPath = path.join(__dirname, "stagehand-browser")
      const packageJsonPath = path.join(stagehandPath, "package.json")
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error("Stagehand browser directory not found. Please ensure stagehand-browser is properly set up.")
      }
      
      return { success: true, message: "Stagehand service initialized" }
    } catch (error) {
      console.error("Error initializing Stagehand:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("execute-stagehand-task", async (event, userQuery) => {
    try {
      console.log("Executing Stagehand task:", userQuery)
      
      // Set the environment variable for the user query
      process.env.USER_QUERY = userQuery
      
      // Run the Stagehand script using npm with shell option for better cross-platform support
      return new Promise((resolve, reject) => {
        const stagehandProcess = spawn("npm", ["run", "start"], {
          cwd: path.join(__dirname, "stagehand-browser"),
          env: { 
            ...process.env, 
            USER_QUERY: userQuery
          },
          shell: true, // Use shell for better cross-platform support
          stdio: ['pipe', 'pipe', 'pipe']
        })
        
        let output = ""
        let errorOutput = ""
        
        stagehandProcess.stdout.on("data", (data) => {
          const newOutput = data.toString()
          output += newOutput
          console.log("Stagehand output:", newOutput)
          
          // Parse the output line by line to detect COT events
          const lines = newOutput.split('\n')
          lines.forEach(line => {
            line = line.trim()
            if (line) {
              try {
                // Try to parse as JSON to detect Stagehand output events
                const parsed = JSON.parse(line)
                if (parsed.type === "stagehand-output") {
                  // Try to enhance the event with COT service
                  if (cotEnhancementService) {
                    const enhancedEvent = cotEnhancementService.addReasoningEvent(parsed.data);
                    // If enhancement service processes it, don't send original
                    if (enhancedEvent === null) {
                      return; // Event is being processed for enhancement, suppress original
                    }
                  }
                  
                  // Only send original Stagehand output event if enhancement is disabled
                  // or if it's not a reasoning event type
                  const reasoningTypes = [
                    'agent_action', 
                    'agent_llm', 
                    'agent_debug', 
                    'agent_info',
                    'thinking_start',
                    'analyzing_request',
                    'planning_approach',
                    'executing_steps'
                  ];
                  
                  // Skip raw reasoning events when enhancement is enabled
                  if (cotEnhancementService && reasoningTypes.includes(parsed.data.type)) {
                    return; // Don't send raw reasoning events
                  }
                  
                  // Send original Stagehand output event to frontend (non-reasoning events only)
                  mainWindow.webContents.send("stagehand-stream", {
                    type: "stagehand-output",
                    data: parsed.data,
                    isComplete: false
                  })
                  return // Don't send as regular output
                }
              } catch (e) {
                // Not JSON, treat as regular output
              }
              
              // Extract real Stagehand instructions from raw logs for COT enhancement
              if (cotEnhancementService) {
                const stagehandEvent = parseStagehandInstruction(line);
                if (stagehandEvent) {
                  console.log("COT Enhancement: Extracted real Stagehand instruction:", stagehandEvent);
                  cotEnhancementService.addReasoningEvent(stagehandEvent);
                }
              }
              
              // Skip raw terminal output if enhancement is enabled and suppression is on
              if (cotEnhancementService && cotEnhancementService.shouldSuppressRawEvents()) {
                // Filter out npm script output and other non-important terminal messages
                const skipPatterns = [
                  /^>\s*start$/,
                  /^>\s*tsx\s+index\.ts$/,
                  /^>\s*npm\s+run/,
                  /^>\s*webpack/,
                  /asset\s+bundle\.js/,
                  /orphan\s+modules/,
                  /runtime\s+modules/,
                  /cacheable\s+modules/,
                  /webpack\s+\d+\.\d+\.\d+\s+compiled/,
                  /modules\s+by\s+path/,
                  /\[built\]\s+\[code\s+generated\]/,
                  /\(Use\s+`.*--trace-warnings/,
                  /\(node:\d+\)\s+\[.*\]\s+Warning:/,
                  /Reparsing\s+as\s+ES\s+module/,
                  /Module\s+type\s+of\s+file:/,
                  /To\s+eliminate\s+this\s+warning/
                ];
                
                const shouldSkip = skipPatterns.some(pattern => pattern.test(line));
                if (shouldSkip) {
                  return; // Skip npm/build output
                }
                
                // Only show raw output if it contains important non-reasoning information
                const importantKeywords = ['error', 'warning', 'complete', 'failed', 'success'];
                const hasImportantInfo = importantKeywords.some(keyword => 
                  line.toLowerCase().includes(keyword)
                );
                
                if (!hasImportantInfo) {
                  return; // Skip non-important raw output
                }
              }
              
              // Send regular output to frontend
          mainWindow.webContents.send("stagehand-stream", {
            type: "output",
                data: line + '\n',
            isComplete: false
              })
            }
          })
        })
        
        stagehandProcess.stderr.on("data", (data) => {
          const newError = data.toString()
          errorOutput += newError
          console.error("Stagehand error:", newError)
          
          // Send error updates to the frontend
          mainWindow.webContents.send("stagehand-stream", {
            type: "error",
            data: newError,
            isComplete: false
          })
        })
        
        stagehandProcess.on("close", (code) => {
          if (code === 0) {
            // Send completion signal
            mainWindow.webContents.send("stagehand-stream", {
              type: "complete",
              data: output,
              isComplete: true,
              success: true
            })
            resolve({ success: true, agentResult: output, error: null })
          } else {
            // Send error completion signal
            mainWindow.webContents.send("stagehand-stream", {
              type: "complete",
              data: errorOutput,
              isComplete: true,
              success: false
            })
            reject(new Error(`Stagehand process exited with code ${code}: ${errorOutput}`))
          }
        })
        
        stagehandProcess.on("error", (error) => {
          // Send error completion signal
          mainWindow.webContents.send("stagehand-stream", {
            type: "complete",
            data: error.message,
            isComplete: true,
            success: false
          })
          reject(error)
        })
      })
    } catch (error) {
      console.error("Error executing Stagehand task:", error)
      return { success: false, agentResult: null, error: error.message }
    }
  })

  ipcMain.handle("stop-stagehand-task", async () => {
    try {
      console.log("Stopping Stagehand task")
      // This would need to be implemented to actually stop the running process
      // For now, we'll just return success
      return { success: true, message: "Stop signal sent" }
    } catch (error) {
      console.error("Error stopping Stagehand task:", error)
      return { success: false, error: error.message }
    }
  })

  // Legacy handler for backward compatibility
  ipcMain.handle("execute-stagehand", async (event, userQuery) => {
    return await ipcMain.handle("execute-stagehand-with-memory", event, userQuery)
  })

   // Memory management handlers
   ipcMain.handle("add-memory", async (event, memoryData) => {
    try {
      const memory = await memoryManager.addMemory(memoryData)
      return { success: true, memory }
    } catch (error) {
      console.error("Error adding memory:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("search-memories", async (event, query, limit = 5) => {
    try {
      const memories = await memoryManager.searchMemories(query, limit)
      return { success: true, memories }
    } catch (error) {
      console.error("Error searching memories:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("get-all-memories", async (event) => {
    try {
      const memories = await memoryManager.getAllMemories()
      return { success: true, memories }
    } catch (error) {
      console.error("Error getting all memories:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("get-memory-stats", async (event) => {
    try {
      const stats = await memoryManager.getMemoryStats()
      return { success: true, stats }
    } catch (error) {
      console.error("Error getting memory stats:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("update-memory", async (event, id, updates) => {
    try {
      const memory = await memoryManager.updateMemory(id, updates)
      return { success: true, memory }
    } catch (error) {
      console.error("Error updating memory:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("delete-memory", async (event, id) => {
    try {
      const memory = await memoryManager.deleteMemory(id)
      return { success: true, memory }
    } catch (error) {
      console.error("Error deleting memory:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("clear-all-memories", async (event) => {
    try {
      const result = await memoryManager.clearAllMemories()
      return result
    } catch (error) {
      console.error("Error clearing memories:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("export-memories", async (event, exportPath) => {
    try {
      const success = await memoryManager.exportMemories(exportPath)
      return { success }
    } catch (error) {
      console.error("Error exporting memories:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("import-memories", async (event, importPath) => {
    try {
      const success = await memoryManager.importMemories(importPath)
      return { success }
    } catch (error) {
      console.error("Error importing memories:", error)
      return { success: false, error: error.message }
    }
  })

  // Enhanced Stagehand execution with memory integration
  ipcMain.handle("execute-stagehand-with-memory", async (event, userQuery) => {
    try {
      console.log("Executing Stagehand task with memory context:", userQuery)

      // Clear COT enhancement buffer for new task
      if (cotEnhancementService) {
        cotEnhancementService.clearBuffer()
      }

      // Search for relevant memories
      const relevantMemories = await memoryManager.searchMemories(userQuery, 3)
      let memoryContext = ""
      let enhancedQuery = userQuery

      if (relevantMemories.length > 0) {
        console.log(`🧠 Found ${relevantMemories.length} relevant memories for context`)

        // Use the memory-based enhancement
        enhancedQuery = await memoryManager.enhanceQueryWithMemories(userQuery, relevantMemories)

        // Create memory context for the agent
        memoryContext = "\n\n🧠 MEMORY CONTEXT - Previous actions that match your request:\n"

        for (const memory of relevantMemories) {
          const date = new Date(memory.timestamp).toLocaleDateString()
          memoryContext += `📅 ${date}: ${memory.description}\n`

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
              .join('\n')

            if (usefulDetails) {
              memoryContext += usefulDetails + '\n'
            }
          }
          memoryContext += "\n"
        }

        console.log(`🔄 Enhanced query: "${enhancedQuery}"`)
      } else {
        console.log("🧠 No relevant memories found for this query")
      }

      // Set the environment variable for the user query with memory context
      process.env.USER_QUERY = userQuery
      process.env.MEMORY_CONTEXT = memoryContext
      process.env.ENHANCED_QUERY = enhancedQuery

      // Run the Stagehand script with memory context
      return new Promise((resolve, reject) => {
        const stagehandProcess = spawn("npm", ["run", "start"], {
          cwd: path.join(__dirname, "stagehand-browser"),
          env: { 
            ...process.env, 
            USER_QUERY: userQuery,
            MEMORY_CONTEXT: memoryContext,
            ENHANCED_QUERY: enhancedQuery
          },
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        })

        let output = ""
        let errorOutput = ""

        stagehandProcess.stdout.on("data", (data) => {
          const newOutput = data.toString()
          output += newOutput
          console.log("Stagehand output:", newOutput)

          // Parse the output line by line to detect COT events
          const lines = newOutput.split('\n')
          lines.forEach(line => {
            line = line.trim()
            if (line) {
              try {
                // Try to parse as JSON to detect COT events
                const parsed = JSON.parse(line)
                if (parsed.type === "cot") {
                  // Send COT event to frontend
                  mainWindow.webContents.send("stagehand-stream", {
                    type: "cot",
                    data: parsed.data,
                    isComplete: false
                  })
                  return // Don't send as regular output
                }
              } catch (e) {
                // Not JSON, treat as regular output
              }

              // Extract real Stagehand instructions from raw logs for COT enhancement
              if (cotEnhancementService) {
                const stagehandEvent = parseStagehandInstruction(line);
                if (stagehandEvent) {
                  console.log("COT Enhancement: Extracted real Stagehand instruction:", stagehandEvent);
                  cotEnhancementService.addReasoningEvent(stagehandEvent);
                }
              }
              
              // Skip raw terminal output if enhancement is enabled and suppression is on
              if (cotEnhancementService && cotEnhancementService.shouldSuppressRawEvents()) {
                // Filter out npm script output and other non-important terminal messages
                const skipPatterns = [
                  /^>\s*start$/,
                  /^>\s*tsx\s+index\.ts$/,
                  /^>\s*npm\s+run/,
                  /^>\s*webpack/,
                  /asset\s+bundle\.js/,
                  /orphan\s+modules/,
                  /runtime\s+modules/,
                  /cacheable\s+modules/,
                  /webpack\s+\d+\.\d+\.\d+\s+compiled/,
                  /modules\s+by\s+path/,
                  /\[built\]\s+\[code\s+generated\]/,
                  /\(Use\s+`.*--trace-warnings/,
                  /\(node:\d+\)\s+\[.*\]\s+Warning:/,
                  /Reparsing\s+as\s+ES\s+module/,
                  /Module\s+type\s+of\s+file:/,
                  /To\s+eliminate\s+this\s+warning/
                ];
                
                const shouldSkip = skipPatterns.some(pattern => pattern.test(line));
                if (shouldSkip) {
                  return; // Skip npm/build output
                }
                
                // Only show raw output if it contains important non-reasoning information
                const importantKeywords = ['error', 'warning', 'complete', 'failed', 'success'];
                const hasImportantInfo = importantKeywords.some(keyword => 
                  line.toLowerCase().includes(keyword)
                );
                
                if (!hasImportantInfo) {
                  return; // Skip non-important raw output
                }
              }
              
              // Send regular output to frontend
              mainWindow.webContents.send("stagehand-stream", {
                type: "output",
                data: line + '\n',
                isComplete: false
              })
            }
          })
        })

        stagehandProcess.stderr.on("data", (data) => {
          const newError = data.toString()
          errorOutput += newError
          console.error("Stagehand error:", newError)

          // Send error updates to the frontend
          mainWindow.webContents.send("stagehand-stream", {
            type: "error",
            data: newError,
            isComplete: false
          })
        })

        stagehandProcess.on("close", async (code) => {
          if (code === 0) {
            // Save the result as a memory
            const resultMemory = {
              type: "action",
              category: "automation",
              description: `Executed: ${enhancedQuery}`,
              details: {
                query: userQuery,
                enhancedQuery: enhancedQuery,
                result: output,
                exit_code: code,
                success: true
              },
              tags: ["stagehand", "automation", "execution"],
              relatedQueries: [userQuery, enhancedQuery]
            }

            await memoryManager.addMemory(resultMemory)

            // If the result contains specific information, store it separately
            if (output.length > 0) {
              const infoMemory = {
                type: "information",
                category: "automation",
                description: `Information from: ${enhancedQuery}`,
                details: {
                  extractedInfo: output,
                  source: "agent_execution",
                  timestamp: new Date().toISOString()
                },
                tags: ["information", "extracted", "stagehand"],
                relatedQueries: [userQuery, enhancedQuery]
              }

              await memoryManager.addMemory(infoMemory)
            }

            // Send completion signal
            mainWindow.webContents.send("stagehand-stream", {
              type: "complete",
              data: output,
              isComplete: true,
              success: true
            })
            resolve({ success: true, agentResult: output, error: null })
          } else {
            // Send error completion signal
            mainWindow.webContents.send("stagehand-stream", {
              type: "complete",
              data: errorOutput,
              isComplete: true,
              success: false
            })
            reject(new Error(`Stagehand process exited with code ${code}: ${errorOutput}`))
          }
        })

        stagehandProcess.on("error", (error) => {
          // Send error completion signal
          mainWindow.webContents.send("stagehand-stream", {
            type: "complete",
            data: error.message,
            isComplete: true,
            success: false
          })
          reject(error)
        })
      })
    } catch (error) {
      console.error("Error executing Stagehand task with memory:", error)
      return { success: false, agentResult: null, error: error.message }
    }
  })

  // Handle audio file saving
  ipcMain.handle("save-audio-file", async (event, { buffer, filename }) => {
    try {
      // Create public folder in the project directory
      const publicPath = path.join(__dirname, "public")
      
      // Create the public directory if it doesn't exist
      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true })
      }
      
      const filePath = path.join(publicPath, filename)
      
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      return {
        success: true,
        filename: filename,
        path: filePath
      }
    } catch (error) {
      console.error("Error saving audio file:", error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Handle audio transcription with Groq
  ipcMain.handle("transcribe-audio", async (event, { filePath }) => {
    try {
      // Check if Groq API key is set
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not set. Please run 'npm run setup' to configure your API key.")
      }
      
      console.log("Transcribing audio file:", filePath)
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error("Audio file not found")
      }

      // Create a readable stream from the file
      const audioStream = fs.createReadStream(filePath)
      
      // Transcribe using Groq
      const transcription = await groq.audio.transcriptions.create({
        file: audioStream,
        model: "distil-whisper-large-v3-en",
        response_format: "verbose_json",
      })

      console.log("Transcription completed:", transcription.text)
      
      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Add IPC handler for getting Google API key
  ipcMain.handle("get-google-api-key", () => {
    return process.env.GOOGLE_API_KEY || null;
  });
}

// Function to parse real Stagehand instructions from raw terminal output
function parseStagehandInstruction(line) {
  // Parse Stagehand observe instructions - updated regex for actual format
  const observeMatch = line.match(/INFO: running observe[\s\S]*?instruction: "([^"]+)"/);
  if (observeMatch) {
    return {
      type: "stagehand_observe",
      content: `Observing: ${observeMatch[1]}`,
      level: "info",
      timestamp: new Date().toISOString(),
      instruction: observeMatch[1]
    };
  }
  
  // Parse Stagehand act instructions - updated for multiline format
  if (line.includes('INFO: Performing act from an ObserveResult')) {
    // Store the line for potential multiline parsing
    global.stagehandActLine = line;
    return null; // Will be processed when we get the full observeResult
  }
  
  // Parse observeResult with description and method
  const observeResultMatch = line.match(/"description": "([^"]+)"[\s\S]*?"method": "([^"]+)"/);
  if (observeResultMatch && global.stagehandActLine) {
    const result = {
      type: "stagehand_action",
      content: `Acting: ${observeResultMatch[2]} on ${observeResultMatch[1]}`,
      level: "info", 
      timestamp: new Date().toISOString(),
      action: observeResultMatch[2],
      target: observeResultMatch[1]
    };
    global.stagehandActLine = null; // Clear the stored line
    return result;
  }
  
  // Parse navigation events - updated regex
  const navMatch = line.match(/INFO: new page detected with URL[\s\S]*?url: "([^"]+)"/);
  if (navMatch) {
    return {
      type: "stagehand_navigation",
      content: `Navigated to: ${navMatch[1]}`,
      level: "info",
      timestamp: new Date().toISOString(),
      url: navMatch[1]
    };
  }
  
  // Parse element finding - updated regex
  const elementMatch = line.match(/INFO: found elements[\s\S]*?"description": "([^"]+)"/);
  if (elementMatch) {
    return {
      type: "stagehand_discovery",
      content: `Found element: ${elementMatch[1]}`,
      level: "info",
      timestamp: new Date().toISOString(),
      element: elementMatch[1]
    };
  }
  
  return null;
}

app.whenReady().then(async () => {
  createWindow()
  
  // Initialize COT Enhancement Service
  await initializeCOTService()
  
  // Register global keyboard shortcuts
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false)
      } else {
        mainWindow.setFullScreen(true)
      }
    }
  })
  
  // Register Escape key to exit fullscreen
  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false)
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
