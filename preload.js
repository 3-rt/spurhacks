const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
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
  }
}); 