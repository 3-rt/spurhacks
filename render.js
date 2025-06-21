// DOM elements
const compactBox = document.getElementById("compact-box")
const agentContainer = document.getElementById("agent-container")
const boxContent = document.querySelector("#compact-box > div")
const messageInput = document.querySelector("input[type='text']")
const chatContainer = document.querySelector(".flex-1.overflow-y-auto")

// Recording elements
const micBtn = document.getElementById("mic-btn")
const micText = document.getElementById("mic-text")
const recordingStatus = document.getElementById("recording-status")
const recordingTime = document.getElementById("recording-time")
const stopRecordingBtn = document.getElementById("stop-recording")

// State
let isExpanded = false
let isDragging = false
let dragStartX = 0
let dragStartY = 0

// Recording state
let isRecording = false
let mediaRecorder = null
let audioChunks = []
let recordingStartTime = 0
let recordingTimer = null

// Initialize the app in compact mode
function initApp() {
  compactBox.classList.remove("opacity-0", "pointer-events-none")
  agentContainer.classList.remove("opacity-100", "pointer-events-auto")
  agentContainer.classList.add("opacity-0", "pointer-events-none")
}

// Expand the window and show agent interface
function expandWindow() {
  isExpanded = true
  window.electronAPI.expandWindow().then(() => {
    compactBox.classList.add("opacity-0", "pointer-events-none")
    agentContainer.classList.remove("opacity-0", "pointer-events-none")
    agentContainer.classList.add("opacity-100", "pointer-events-auto")
  })
}

// Collapse the window and show compact box
function collapseWindow() {
  isExpanded = false
  window.electronAPI.collapseWindow().then(() => {
    compactBox.classList.remove("opacity-0", "pointer-events-none")
    agentContainer.classList.remove("opacity-100", "pointer-events-auto")
    agentContainer.classList.add("opacity-0", "pointer-events-none")
  })
}

// Dragging functionality for compact box
function startDragging(e) {
  if (isExpanded) return
  
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  
  document.addEventListener("mousemove", handleDrag)
  document.addEventListener("mouseup", stopDragging)
}

function handleDrag(e) {
  if (!isDragging) return
  
  const deltaX = e.clientX - dragStartX
  const deltaY = e.clientY - dragStartY
  
  // Get current window position and update it
  window.electronAPI.setWindowPosition(deltaX, deltaY)
}

function stopDragging() {
  isDragging = false
  document.removeEventListener("mousemove", handleDrag)
  document.removeEventListener("mouseup", stopDragging)
}

// Keyboard event listener for expansion
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === 'a' && !isExpanded) {
    expandWindow()
  }
})

// Event listeners
boxContent.addEventListener("mousedown", startDragging)

// Add click event to expand window when clicking on compact box
boxContent.addEventListener("click", (e) => {
  // Only expand if not dragging
  if (!isDragging) {
    expandWindow()
  }
})

// Window control buttons
document.getElementById("collapse-btn").addEventListener("click", () => {
  collapseWindow()
})

document.getElementById("minimize-btn").addEventListener("click", () => {
  window.electronAPI.windowMinimize()
})

document.getElementById("maximize-btn").addEventListener("click", () => {
  window.electronAPI.windowMaximize()
})

document.getElementById("close-btn").addEventListener("click", () => {
  window.electronAPI.windowClose()
})

// Microphone recording event listeners
micBtn.addEventListener("click", () => {
  if (!isRecording) {
    startRecording()
  } else {
    stopRecording()
  }
})

stopRecordingBtn.addEventListener("click", () => {
  stopRecording()
})

// Message input handling
messageInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && messageInput.value.trim()) {
    const userQuery = messageInput.value.trim()
    addMessage(userQuery, "user")
    messageInput.value = ""

    // Add thinking section
    setTimeout(() => {
      addThinkingSection()
    }, 500)

    try {
      // Show loading state
      const loadingMessage = addMessage("Executing your request...", "assistant")
      
      // Create a streaming message for real-time updates
      const streamingMessage = addMessage("", "assistant")
      let streamingContent = ""
      
      // Apply streaming text styles
      const streamingTextElement = streamingMessage.querySelector(".flex-1")
      streamingTextElement.classList.add("streaming-text")
      
      // Set up real-time streaming listener
      const streamHandler = (data) => {
        if (data.type === "output") {
          streamingContent += data.data
          streamingTextElement.textContent = streamingContent
          scrollToBottom()
        } else if (data.type === "error") {
          streamingContent += `Error: ${data.data}`
          streamingTextElement.textContent = streamingContent
          scrollToBottom()
        } else if (data.type === "complete") {
          // Remove the streaming listener
          window.electronAPI.removeAllListeners('stagehand-stream')
          
          if (data.success) {
            streamingContent += "\n\n✅ Task completed successfully!"
          } else {
            streamingContent += "\n\n❌ Task failed"
          }
          streamingTextElement.textContent = streamingContent
          scrollToBottom()
        }
      }
      
      // Start listening for streaming updates
      window.electronAPI.onStagehandStream(streamHandler)
      
      // Execute Stagehand with the user's query
      const result = await Promise.race([
        window.stagehand.executeQuery(userQuery),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out")), 60000) // 60 second timeout
        )
      ])
      
      // Remove the thinking section
      const thinkingSection = chatContainer.querySelector(".bg-slate-900\\/50")
      if (thinkingSection) {
        thinkingSection.remove()
      }
      
      // Remove loading message
      if (loadingMessage) {
        loadingMessage.remove()
      }
      
      // Clean up streaming listener if not already done
      window.electronAPI.removeAllListeners('stagehand-stream')
      
      if (!result.success) {
        // Add error message if streaming didn't handle it
        addMessage(`Error: ${result.error || "Failed to execute task"}`, "assistant")
      }
    } catch (error) {
      // Remove the thinking section
      const thinkingSection = chatContainer.querySelector(".bg-slate-900\\/50")
      if (thinkingSection) {
        thinkingSection.remove()
      }
      
      // Clean up streaming listener
      window.electronAPI.removeAllListeners('stagehand-stream')
      
      // Add error message
      addMessage(`Error: ${error.message || "Failed to execute task"}`, "assistant")
    }
  }
})

// Add context button functionality
document.querySelector("button").addEventListener("click", () => {
  console.log("Add context clicked")
})

// Chain of thought thinking sections
const thinkingSteps = [
  {
    title: "Analyzing request",
    content: "Understanding the user's requirements and breaking down the problem into manageable components."
  },
  {
    title: "Planning approach", 
    content: "Determining the best technical approach and identifying the tools and libraries needed."
  },
  {
    title: "Implementation strategy",
    content: "Creating a step-by-step plan for implementation with consideration for best practices."
  },
  {
    title: "Code structure",
    content: "Organizing the code architecture and planning the file structure for maintainability."
  },
  {
    title: "Testing considerations",
    content: "Identifying potential edge cases and planning how to test the functionality."
  }
]

// Scroll to bottom function
function scrollToBottom() {
  setTimeout(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight
  }, 10)
}

// Add thinking section
function addThinkingSection() {
  const thinkingDiv = document.createElement("div")
  thinkingDiv.className = "bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden"
  
  const header = document.createElement("div")
  header.className = "bg-slate-800/50 px-3 py-2 border-b border-slate-700/50 flex items-center gap-2"
  header.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300">
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
    <span class="text-xs font-medium text-slate-200">Thinking...</span>
    <div class="flex gap-1 ml-auto">
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
      <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
    </div>
  `
  
  const content = document.createElement("div")
  content.className = "p-3 space-y-3"
  
  // Add thinking steps with staggered appearance
  thinkingSteps.forEach((step, index) => {
    setTimeout(() => {
      const stepDiv = document.createElement("div")
      stepDiv.className = "flex gap-2 items-start opacity-0"
      stepDiv.style.animation = "fadeInUp 0.3s ease-out forwards"
      stepDiv.style.animationDelay = `${index * 0.3}s`
      
      stepDiv.innerHTML = `
        <div class="w-5 h-5 bg-slate-700 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
          <span class="text-xs text-slate-300">${index + 1}</span>
        </div>
        <div class="text-xs text-slate-300 leading-relaxed">
          <span class="text-slate-200 font-medium">${step.title}:</span> ${step.content}
        </div>
      `
      content.appendChild(stepDiv)
      scrollToBottom()
    }, index * 300)
  })
  
  thinkingDiv.appendChild(header)
  thinkingDiv.appendChild(content)
  chatContainer.appendChild(thinkingDiv)
  scrollToBottom()
}

// Message handling functions
function addMessage(content, type) {
  const messageDiv = document.createElement("div")
  messageDiv.className = `flex gap-3 max-w-full`

  if (type === "user") {
    messageDiv.innerHTML = `
      <div class="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-slate-300">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div class="flex-1 leading-relaxed text-slate-200 text-sm">${content}</div>
    `
  } else {
    messageDiv.innerHTML = `
      <div class="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="flex-1 leading-relaxed text-slate-200 text-sm">${content}</div>
    `
  }

  chatContainer.appendChild(messageDiv)
  scrollToBottom()
  return messageDiv
}

// Audio recording functions
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await saveAudioFile(audioBlob)
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.start()
    isRecording = true
    recordingStartTime = Date.now()
    
    // Update UI
    micBtn.classList.add("mic-recording", "recording-glow")
    micBtn.classList.remove("bg-slate-800/50", "border-slate-700/50", "text-slate-300")
    micText.textContent = "Recording"
    recordingStatus.classList.remove("hidden")
    recordingStatus.classList.add("recording-status")
    
    // Start timer
    startRecordingTimer()
    
    addMessage("🎤 Started recording audio...", "assistant")
    
  } catch (error) {
    console.error("Error starting recording:", error)
    addMessage("❌ Failed to start recording. Please check microphone permissions.", "assistant")
  }
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return
  
  mediaRecorder.stop()
  isRecording = false
  
  // Update UI
  micBtn.classList.remove("mic-recording", "recording-glow")
  micBtn.classList.add("bg-slate-800/50", "border-slate-700/50", "text-slate-300")
  micText.textContent = "Record"
  recordingStatus.classList.add("hidden")
  recordingStatus.classList.remove("recording-status")
  
  // Stop timer
  stopRecordingTimer()
  
  addMessage("⏹️ Recording stopped. Processing audio...", "assistant")
}

function startRecordingTimer() {
  recordingTimer = setInterval(() => {
    const elapsed = Date.now() - recordingStartTime
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, 1000)
}

function stopRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

async function saveAudioFile(audioBlob) {
  try {
    // Convert to WAV format for better compatibility
    const wavBlob = await convertToWav(audioBlob)
    
    // Send to main process to save file
    const result = await ipcRenderer.invoke("save-audio-file", {
      buffer: await wavBlob.arrayBuffer(),
      filename: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.wav`
    })
    
    if (result.success) {
      addMessage(`✅ Audio saved to public folder: ${result.filename}`, "assistant")
    } else {
      addMessage("❌ Failed to save audio file", "assistant")
    }
  } catch (error) {
    console.error("Error saving audio:", error)
    addMessage("❌ Error processing audio file", "assistant")
  }
}

async function convertToWav(webmBlob) {
  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Decode the webm audio
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Convert to WAV format
  const wavBuffer = audioBufferToWav(audioBuffer)
  
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function audioBufferToWav(buffer) {
  const length = buffer.length
  const numberOfChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
  const view = new DataView(arrayBuffer)
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * numberOfChannels * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * numberOfChannels * 2, true)
  
  // Convert audio data
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  
  return arrayBuffer
}

// Initialize the app
initApp()
