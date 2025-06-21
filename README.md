# Electron Stagehand Integration

This project demonstrates the integration between an Electron app and Stagehand for AI-powered web automation.

## Features

- **Compact UI**: A small draggable box that expands into a full AI agent interface
- **Stagehand Integration**: Direct connection between the UI input and Stagehand agent execution
- **Real-time Results**: Live feedback from Stagehand automation tasks
- **Modern UI**: Beautiful, modern interface with smooth animations

## How It Works

1. **Input Connection**: When you type a query in the input box and press Enter, it's sent directly to Stagehand
2. **Agent Execution**: The query is passed to the Stagehand agent which can perform web automation tasks
3. **Result Display**: The results are displayed back in the chat interface

## Usage

1. **Start the app**: `npm start`
2. **Expand the interface**: Click on the compact box or press 'A'
3. **Enter a query**: Type your automation request (e.g., "go to google and search for AI news")
4. **View results**: The agent will execute the task and show the results

## Architecture

- **main.js**: Electron main process with IPC handlers for Stagehand execution
- **preload.js**: Context bridge for secure IPC communication
- **render.js**: UI logic and Stagehand API integration
- **stagehand-browser/index.ts**: Stagehand agent configuration and execution

## Example Queries

- "go to yahoo finance, find the stock price of Nvidia, and return the price in USD"
- "search for the latest AI news on Google"
- "go to GitHub and find trending repositories"

## Technical Details

The integration works by:
1. User input is captured in the renderer process
2. IPC message is sent to main process via contextBridge
3. Main process spawns Stagehand script with user query as environment variable
4. Stagehand executes the automation and returns results
5. Results are sent back through IPC and displayed in the UI 