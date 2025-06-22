# Stagehand Browser Automation Agent

A modern Electron application that provides a beautiful interface for Stagehand browser automation with session persistence, voice input, and memory management.

## Features

- **Session Persistence**: Browser sessions are maintained between commands for seamless workflow
- **Voice Input**: Speak your commands using the built-in voice recognition
- **Memory System**: Context-aware memory that enhances queries based on previous actions
- **Real-time Streaming**: Watch the agent think and work in real-time
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   cd stagehand-browser && npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp stagehand-browser/.env.example stagehand-browser/.env
   # Add your API keys to stagehand-browser/.env
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

## Usage

1. **Compact Mode**: The app starts in a compact floating window
2. **Expand**: Click the compact window to expand to full interface
3. **Enter Commands**: Type or speak your automation requests
4. **Watch Execution**: See real-time reasoning and execution in the right panel
5. **Browser View**: Monitor the browser automation in the center panel

## Example Commands

- "Go to Google and search for the latest AI news"
- "Find the current stock price of Apple"
- "Go to GitHub and show me trending repositories"
- "Check the weather in San Francisco"

## Architecture

- **Frontend**: React with Tailwind CSS for the UI
- **Backend**: Electron for desktop app functionality
- **Automation**: Stagehand for browser automation
- **AI**: Google Gemini for enhanced reasoning
- **Voice**: Groq for speech-to-text transcription

## Project Structure

```
spurhacks/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── services/          # Business logic services
│   └── lib/               # Utility functions
├── stagehand-browser/     # Stagehand automation backend
│   ├── index.ts           # Main automation logic
│   ├── sessionManager.ts  # Session persistence
│   └── stagehand.config.ts # Configuration
├── main.js                # Electron main process
├── preload.js             # Electron preload script
└── memory-manager.js      # Memory management system
```

## Development

- **Frontend**: `npm run dev` - Start webpack in watch mode
- **Backend**: `cd stagehand-browser && npm run start` - Run Stagehand directly
- **Full App**: `npm start` - Start the complete Electron app

## Environment Variables

Required environment variables in `stagehand-browser/.env`:

- `GOOGLE_API_KEY` - Google Gemini API key
- `BROWSERBASE_API_KEY` - BrowserBase API key  
- `BROWSERBASE_PROJECT_ID` - BrowserBase project ID
- `GROQ_API_KEY` - Groq API key for voice transcription

## License

ISC
