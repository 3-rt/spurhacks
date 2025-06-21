const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    windowMinimize: () => ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => ipcRenderer.invoke('window-maximize'),
    windowClose: () => ipcRenderer.invoke('window-close'),
    expandWindow: () => ipcRenderer.invoke('expand-window'),
    collapseWindow: () => ipcRenderer.invoke('collapse-window'),
    setWindowPosition: (x, y) => ipcRenderer.invoke('set-window-position', x, y),
    
    // Audio recording
    saveAudioFile: (data) => ipcRenderer.invoke('save-audio-file', data),
    transcribeAudio: (filePath) => ipcRenderer.invoke('transcribe-audio', { filePath }),
    
    // Stagehand YouTube automation
    startStagehandYouTube: () => ipcRenderer.invoke('start-stagehand-youtube'),
    checkStagehandStatus: () => ipcRenderer.invoke('check-stagehand-status'),
    
    // Listen for Stagehand output
    onStagehandOutput: (callback) => {
        ipcRenderer.on('stagehand-output', (event, data) => callback(data));
    },
    
    // Listen for Stagehand status updates
    onStagehandStatus: (callback) => {
        ipcRenderer.on('stagehand-status', (event, status) => callback(status));
    },
    
    // Listen for real-time Stagehand streaming
    onStagehandStream: (callback) => {
        ipcRenderer.on('stagehand-stream', (event, data) => callback(data));
    },
    
    // Remove listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

contextBridge.exposeInMainWorld('stagehand', {
  startAutomation: async (instructions) => {
    // Send instructions to main process and wait for result
    try {
      const result = await ipcRenderer.invoke('start-stagehand-youtube', instructions);
      return result && result.output ? result.output : 'No output.';
    } catch (err) {
      return 'Error: ' + (err.message || err);
    }
  },
  
  // New function to execute Stagehand with user query
  executeQuery: async (userQuery) => {
    try {
      const result = await ipcRenderer.invoke('execute-stagehand', userQuery);
      return result;
    } catch (err) {
      return { success: false, output: null, error: err.message };
    }
  }
}); 