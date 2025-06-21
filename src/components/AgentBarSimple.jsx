import React from 'react';
import { useAgentBar } from '../../useAgentBar';

const AgentBarSimple = () => {
  const {
    isExpanded,
    isDragging,
    isRecording,
    recordingTime,
    expandWindow,
    collapseWindow,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    startDragging,
    stopDragging,
    toggleRecording
  } = useAgentBar();

  // If not expanded, show compact box
  if (!isExpanded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300">
        <div 
          className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center cursor-pointer shadow-lg border border-slate-600/50 transition-all duration-300 text-white hover:scale-105 hover:shadow-xl hover:border-slate-500/50 active:scale-95 webkit-app-region-drag"
          onMouseDown={startDragging}
          onMouseUp={stopDragging}
          onClick={(e) => {
            // Only expand if not dragging
            if (!isDragging) {
              expandWindow();
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col opacity-100 pointer-events-auto transition-opacity duration-300 rounded-xl overflow-hidden">
      {/* Custom Title Bar */}
      <div 
        className="bg-slate-900/90 h-10 flex items-center webkit-app-region-drag border-b border-slate-800/50"
        onMouseDown={startDragging}
        onMouseUp={stopDragging}
      >
        <div className="w-full flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-200">AI Agent</span>
          </div>
          <div className="flex webkit-app-region-no-drag gap-1">
            <button 
              onClick={collapseWindow}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 6L10 6" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
            <button 
              onClick={minimizeWindow}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
              </svg>
            </button>
            <button 
              onClick={maximizeWindow}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
            <button 
              onClick={closeWindow}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-red-600/80 hover:text-white rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex gap-3 max-w-full">
            <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex-1 leading-relaxed text-slate-200 text-sm">
              <p>Hello! I'm your AI assistant. How can I help you today?</p>
            </div>
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="bg-slate-900/90 border-t border-slate-800/50 p-4">
          <div className="flex items-center gap-3 bg-slate-950/80 rounded-lg p-3 border border-slate-800/50 shadow-lg">
            <button className="bg-slate-800/50 border border-slate-700/50 text-slate-300 flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Add
            </button>
            <button 
              onClick={toggleRecording}
              className={`border border-slate-700/50 text-slate-300 flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50 ${
                isRecording ? 'bg-red-600/50' : 'bg-slate-800/50'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>{isRecording ? 'Stop' : 'Record'}</span>
            </button>
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder-slate-500"
            />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-700/50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                <span className="text-slate-300">On</span>
              </div>
            </div>
          </div>
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording... {recordingTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentBarSimple; 