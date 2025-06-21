# AI Agent with Stagehand Integration and Audio Recording

A desktop AI agent built with Electron that includes Stagehand web automation and microphone recording functionality.

## Features

- **Compact UI**: A small draggable box that expands into a full AI agent interface
- **Stagehand Integration**: Direct connection between the UI input and Stagehand agent execution
- **Real-time Results**: Live feedback from Stagehand automation tasks with streaming output
- **Audio Recording**: Record audio from your microphone and save as WAV files
- **Modern UI**: Beautiful, modern interface with smooth animations

## Stagehand Integration

### How It Works

1. **Input Connection**: When you type a query in the input box and press Enter, it's sent directly to Stagehand
2. **Agent Execution**: The query is passed to the Stagehand agent which can perform web automation tasks
3. **Real-time Streaming**: Results are displayed in real-time as the agent works
4. **Result Display**: The final results are displayed back in the chat interface

### Usage

1. **Start the app**: `npm start`
2. **Expand the interface**: Click on the compact box or press 'A'
3. **Enter a query**: Type your automation request (e.g., "go to google and search for AI news")
4. **View results**: The agent will execute the task and show the results in real-time

### Example Queries

- "go to yahoo finance, find the stock price of Nvidia, and return the price in USD"
- "search for the latest AI news on Google"
- "go to GitHub and find trending repositories"

## Audio Recording

### How to Use
1. Click the microphone button to start recording
2. Speak into your microphone
3. Click the microphone button again or the "Stop" button to end recording
4. Audio files are automatically saved to the `public/` folder

### File Storage
- **Location**: `public/` folder in the project directory
- **Format**: WAV files for maximum compatibility
- **Naming**: `recording_YYYY-MM-DDTHH-MM-SS-sssZ.wav`

### Permissions
The app will request microphone access when you first try to record. Make sure to grant permission for the recording feature to work.

## Architecture

- **main.js**: Electron main process with IPC handlers for Stagehand execution and audio recording
- **preload.js**: Context bridge for secure IPC communication
- **render.js**: UI logic, Stagehand API integration, and audio recording interface
- **stagehand-browser/index.ts**: Stagehand agent configuration and execution

## Technical Details

### Stagehand Integration
The integration works by:
1. User input is captured in the renderer process
2. IPC message is sent to main process via contextBridge
3. Main process spawns Stagehand script with user query as environment variable
4. Stagehand executes the automation and streams results back in real-time
5. Results are sent back through IPC and displayed in the UI

### Audio Recording
Audio recording is handled through:
1. Web Audio API for microphone access
2. IPC communication for file saving
3. Automatic file management in the public directory

## Development

### Running the App
```bash
npm start
```

### Building
```bash
npm run build
```

## File Structure
```
spurhacks/
├── public/                    # Audio recordings saved here
├── stagehand-browser/         # Stagehand automation scripts
├── index.html                 # Main interface
├── render.js                  # Frontend logic
├── main.js                    # Electron main process
├── preload.js                 # IPC bridge
├── styles.css                 # Styling
└── package.json               # Dependencies
```
