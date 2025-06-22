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
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    setWindowPosition: (x, y) => ipcRenderer.invoke('set-window-position', x, y),
    
    // Audio recording
    saveAudioFile: (data) => ipcRenderer.invoke('save-audio-file', data),
    transcribeAudio: (filePath) => ipcRenderer.invoke('transcribe-audio', { filePath }),
    getGoogleApiKey: () => ipcRenderer.invoke('get-google-api-key'),
    
    // Stagehand browser automation
    initializeStagehand: () => ipcRenderer.invoke('initialize-stagehand'),
    executeStagehandTask: (userQuery) => ipcRenderer.invoke('execute-stagehand-task', userQuery),
    stopStagehandTask: () => ipcRenderer.invoke('stop-stagehand-task'),
    
    // Legacy Stagehand methods for backward compatibility
    startStagehandYouTube: () => ipcRenderer.invoke('start-stagehand-youtube'),
    checkStagehandStatus: () => ipcRenderer.invoke('check-stagehand-status'),
    executeStagehand: (userQuery) => ipcRenderer.invoke('execute-stagehand', userQuery),
    
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
    
    // Memory management
    addMemory: (memoryData) => ipcRenderer.invoke('add-memory', memoryData),
    searchMemories: (query, limit) => ipcRenderer.invoke('search-memories', query, limit),
    getAllMemories: () => ipcRenderer.invoke('get-all-memories'),
    getMemoryStats: () => ipcRenderer.invoke('get-memory-stats'),
    updateMemory: (id, updates) => ipcRenderer.invoke('update-memory', id, updates),
    deleteMemory: (id) => ipcRenderer.invoke('delete-memory', id),
    clearAllMemories: () => ipcRenderer.invoke('clear-all-memories'),
    exportMemories: (exportPath) => ipcRenderer.invoke('export-memories', exportPath),
    importMemories: (importPath) => ipcRenderer.invoke('import-memories', importPath),
    
    // Enhanced Stagehand with memory integration
    executeStagehandWithMemory: (userQuery) => ipcRenderer.invoke('execute-stagehand-with-memory', userQuery),
    
    // System connectivity tests
    testGroqConnection: () => ipcRenderer.invoke('test-groq-connection'),
    
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
      const result = await ipcRenderer.invoke('execute-stagehand-task', userQuery);
      return result;
    } catch (err) {
      return { success: false, agentResult: null, error: err.message };
    }
  }
}); 