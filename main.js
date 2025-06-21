const { app, BrowserWindow, ipcMain, screen } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const fs = require("fs")
const os = require("os")
const Groq = require("groq-sdk")
const http = require("http")

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
let persistentServerProcess = null
let serverPort = 3001

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
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
  })

  mainWindow.loadFile("index.html")

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
    
    // Fixed size for the agent window (similar to Cursor)
    const agentWidth = 400
    const agentHeight = 600
    
    // Position on the right side of the screen
    const x = screenWidth - agentWidth - 20 // 20px margin from right edge
    const y = 20 // 20px margin from top
    
    mainWindow.setBounds({
      x: x,
      y: y,
      width: agentWidth,
      height: agentHeight
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

  // Stagehand integration with persistent server
  ipcMain.handle("execute-stagehand", async (event, userQuery) => {
    try {
      console.log("Executing Stagehand with query:", userQuery)
      
      // Ensure the persistent server is running
      await ensurePersistentServer()
      
      // Send request to persistent server using SSE
      return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: userQuery })
        
        const options = {
          hostname: 'localhost',
          port: serverPort,
          path: '/execute',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }
        
        const req = http.request(options, (res) => {
          let buffer = ''
          
          res.on('data', (chunk) => {
            buffer += chunk.toString()
            
            // Process SSE data
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  // Send updates to frontend based on type
                  switch (data.type) {
                    case 'connected':
                      mainWindow.webContents.send("stagehand-stream", {
                        type: "output",
                        data: data.message,
                        isComplete: false
                      })
                      break
                      
                    case 'start':
                      mainWindow.webContents.send("stagehand-stream", {
                        type: "output",
                        data: data.message,
                        isComplete: false
                      })
                      break
                      
                    case 'output':
                      mainWindow.webContents.send("stagehand-stream", {
                        type: "output",
                        data: data.data,
                        isComplete: false
                      })
                      break
                      
                    case 'error':
                      mainWindow.webContents.send("stagehand-stream", {
                        type: "error",
                        data: data.data,
                        isComplete: false
                      })
                      break
                      
                    case 'status':
                      mainWindow.webContents.send("stagehand-stream", {
                        type: "output",
                        data: data.message,
                        isComplete: false
                      })
                      break
                      
                    case 'complete':
                      if (data.success) {
                        mainWindow.webContents.send("stagehand-stream", {
                          type: "complete",
                          data: JSON.stringify(data.result, null, 2),
                          isComplete: true,
                          success: true
                        })
                        resolve(data.result)
                      } else {
                        mainWindow.webContents.send("stagehand-stream", {
                          type: "complete",
                          data: data.error,
                          isComplete: true,
                          success: false
                        })
                        reject(new Error(data.error))
                      }
                      break
                  }
                } catch (parseError) {
                  console.error("Error parsing SSE data:", parseError)
                }
              }
            }
          })
          
          res.on('end', () => {
            // Handle any remaining data
            if (buffer.trim()) {
              const lines = buffer.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.type === 'complete') {
                      if (data.success) {
                        resolve(data.result)
                      } else {
                        reject(new Error(data.error))
                      }
                    }
                  } catch (parseError) {
                    console.error("Error parsing final SSE data:", parseError)
                  }
                }
              }
            }
          })
        })
        
        req.on('error', (error) => {
          console.error("Error communicating with persistent server:", error)
          reject(error)
        })
        
        req.write(postData)
        req.end()
      })
      
    } catch (error) {
      console.error("Error executing Stagehand:", error)
      return { success: false, output: null, error: error.message }
    }
  })

  // Initialize persistent browser session
  ipcMain.handle("initialize-browser", async (event) => {
    try {
      console.log("Initializing persistent browser session...")
      await ensurePersistentServer()
      return { success: true, message: "Browser session initialized" }
    } catch (error) {
      console.error("Error initializing browser:", error)
      return { success: false, output: null, error: error.message }
    }
  })

  // Close browser session
  ipcMain.handle("close-browser", async (event) => {
    try {
      console.log("Closing browser session...")
      
      if (persistentServerProcess) {
        // Send close request to server
        const postData = JSON.stringify({})
        const options = {
          hostname: 'localhost',
          port: serverPort,
          path: '/close',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }
        
        const req = http.request(options, () => {
          // Kill the process after a short delay
          setTimeout(() => {
            if (persistentServerProcess) {
              persistentServerProcess.kill('SIGTERM')
              persistentServerProcess = null
            }
          }, 1000)
        })
        
        req.write(postData)
        req.end()
      }
      
      return { success: true, message: "Browser session closed" }
    } catch (error) {
      console.error("Error closing browser:", error)
      return { success: false, error: error.message }
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
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  // Close persistent server before quitting
  if (persistentServerProcess) {
    console.log("Closing persistent server...")
    persistentServerProcess.kill('SIGTERM')
  }
  
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle app quit
app.on("before-quit", () => {
  if (persistentServerProcess) {
    console.log("Closing persistent server...")
    persistentServerProcess.kill('SIGTERM')
  }
})

// Helper function to ensure persistent server is running
async function ensurePersistentServer() {
  if (persistentServerProcess) {
    // Check if server is still running
    try {
      const status = await checkServerStatus()
      if (status.isReady) {
        return
      }
    } catch (error) {
      console.log("Server not responding, restarting...")
    }
  }
  
  // Start the persistent server
  console.log("Starting persistent server...")
  persistentServerProcess = spawn("npm", ["run", "server"], {
    cwd: path.join(__dirname, "stagehand-browser"),
    env: { ...process.env },
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  
  persistentServerProcess.stdout.on("data", (data) => {
    const output = data.toString()
    console.log("Persistent server:", output)
    
    // Check if server is ready
    if (output.includes("🌐 Server listening on port")) {
      const portMatch = output.match(/port (\d+)/)
      if (portMatch) {
        serverPort = parseInt(portMatch[1])
        console.log(`Server ready on port ${serverPort}`)
      }
    }
  })
  
  persistentServerProcess.stderr.on("data", (data) => {
    console.error("Persistent server error:", data.toString())
  })
  
  // Wait for server to be ready
  let attempts = 0
  while (attempts < 30) {
    try {
      const status = await checkServerStatus()
      if (status.isReady) {
        console.log("Persistent server is ready")
        return
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }
  
  throw new Error("Failed to start persistent server")
}

// Helper function to check server status
function checkServerStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: serverPort,
      path: '/status',
      method: 'GET'
    }
    
    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.end()
  })
}
