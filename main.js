const { app, BrowserWindow, ipcMain, screen } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const fs = require("fs")
const os = require("os")
const Groq = require("groq-sdk")

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

function createWindow() {
  // Get screen size to position the window in top right
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  
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
      mainWindow.maximize()
    }
  })

  ipcMain.handle("window-close", () => {
    mainWindow.close()
  })

  // Handle window expansion to fixed size on the right
  ipcMain.handle("expand-window", () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    // Calculate 16:9 dimensions based on 90% of screen height
    const aspectHeight = Math.floor(screenHeight * 0.9);
    const aspectWidth = Math.floor(aspectHeight * (16 / 9));
    
    // Center the window
    const x = Math.floor((screenWidth - aspectWidth) / 2);
    const y = Math.floor((screenHeight - aspectHeight) / 2);
    
    mainWindow.setBounds({
      x: x,
      y: y,
      width: aspectWidth,
      height: aspectHeight
    })
  })

  // Handle window collapse
  ipcMain.handle("collapse-window", () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize
    
    mainWindow.setBounds({
      x: screenWidth - 100,
      y: 20,
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
                  // Send Stagehand output event to frontend
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
    return await ipcMain.handle("execute-stagehand-task", event, userQuery)
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
}

app.whenReady().then(createWindow)

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
