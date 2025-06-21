# AI Agent with Audio Recording

A desktop AI agent built with Electron that includes microphone recording functionality.

## Features

- **Compact Mode**: Small draggable interface that can be expanded
- **AI Chat Interface**: Full-featured chat interface with thinking animations
- **Audio Recording**: Record audio from your microphone and save as WAV files

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
├── public/           # Audio recordings saved here
├── index.html        # Main interface
├── render.js         # Frontend logic
├── main.js          # Electron main process
├── styles.css       # Styling
└── package.json     # Dependencies
``` 