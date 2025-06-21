# AI Agent with Stagehand Integration and Audio Recording

A desktop AI agent built with Electron that includes Stagehand web automation, microphone recording, and speech-to-text transcription using Groq Cloud.

## Features

- **Compact UI**: A small draggable box that expands into a full AI agent interface
- **Stagehand Integration**: Direct connection between the UI input and Stagehand agent execution
- **Real-time Results**: Live feedback from Stagehand automation tasks with streaming output
- **Audio Recording**: Record audio from your microphone and save as WAV files
- **Speech-to-Text**: Automatic transcription of recorded audio using Groq Cloud
- **Voice Commands**: Use voice input to control the AI agent
- **Modern UI**: Beautiful, modern interface with smooth animations

## Setup

### Prerequisites

1. **Groq API Key**: The app uses the existing GROQ API key from `stagehand-browser/.env`
   - If you need to update the API key, edit `stagehand-browser/.env`
   - Get your API key from [Groq Cloud](https://console.groq.com/)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the application
npm start
```

## Voice Control

### How to Use Voice Commands

1. **Start Recording**: Click the microphone button
2. **Speak Your Command**: Clearly state what you want the AI to do
3. **Stop Recording**: Click the microphone button again or the "Stop" button
4. **Review & Execute**: The transcribed text appears in the input box
5. **Edit if Needed**: You can edit the text before pressing Enter
6. **Execute**: Press Enter to run your command through Stagehand

### Example Voice Commands

- "Go to Google and search for the latest AI news"
- "Check the weather in San Francisco"
- "Find the current stock price of Apple"
- "Go to GitHub and show me trending repositories"

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

## Audio Recording & Transcription

### How to Use
1. Click the microphone button to start recording
2. Speak into your microphone
3. Click the microphone button again or the "Stop" button to end recording
4. Audio files are automatically saved to the `public/` folder
5. **Automatic Transcription**: The audio is automatically transcribed using Groq Cloud
6. **Voice Commands**: The transcribed text is placed in the input box for easy execution

### File Storage
- **Location**: `public/` folder in the project directory
- **Format**: WAV files for maximum compatibility
- **Naming**: `recording_YYYY-MM-DDTHH-MM-SS-sssZ.wav`

### Transcription Features
- **High Accuracy**: Uses Groq's distil-whisper-large-v3-en model
- **Multiple Languages**: Supports various languages automatically
- **Real-time Feedback**: Shows transcription progress and results
- **Easy Editing**: Transcribed text can be edited before execution

### Permissions
The app will request microphone access when you first try to record. Make sure to grant permission for the recording feature to work.

## Architecture

- **main.js**: Electron main process with IPC handlers for Stagehand execution, audio recording, and Groq transcription
- **preload.js**: Context bridge for secure IPC communication
- **render.js**: UI logic, Stagehand API integration, audio recording interface, and transcription handling
- **stagehand-browser/index.ts**: Stagehand agent configuration and execution

## Technical Details

### Stagehand Integration
The integration works by:
1. User input is captured in the renderer process
2. IPC message is sent to main process via contextBridge
3. Main process spawns Stagehand script with user query as environment variable
4. Stagehand executes the automation and streams results back in real-time
5. Results are sent back through IPC and displayed in the UI

### Audio Recording & Transcription
Audio recording and transcription is handled through:
1. Web Audio API for microphone access
2. IPC communication for file saving
3. Automatic file management in the public directory
4. Groq Cloud API for high-quality speech-to-text transcription
5. Automatic input population for voice command execution

### Groq Integration
The Groq integration provides:
- **High-quality transcription** using the distil-whisper-large-v3-en model
- **Automatic language detection** for multi-language support
- **Verbose JSON response** with additional metadata
- **Error handling** for API failures and network issues

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
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## Troubleshooting

### Common Issues

1. **"GROQ_API_KEY not set"**: Check that the `stagehand-browser/.env` file exists and contains a valid GROQ_API_KEY
2. **"Microphone access denied"**: Check your browser/system microphone permissions
3. **"Transcription failed"**: Verify your Groq API key is valid and has credits
4. **"No microphone found"**: Ensure your microphone is connected and working

### API Key Setup

The app automatically loads the GROQ_API_KEY from `stagehand-browser/.env`. To update it:

1. Edit `stagehand-browser/.env`
2. Update the `GROQ_API_KEY` value
3. Restart the application

Example `.env` file:
```
GROQ_API_KEY=gsk_your-api-key-here
```
