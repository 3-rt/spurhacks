import React from 'react';

function TitleBar({ onCollapse }) {
  const handleClose = () => {
    window.electronAPI.windowClose();
  };

  const handleFullscreen = () => {
    window.electronAPI.toggleFullscreen();
  };

  return (
    <div className="bg-gray-950/90 backdrop-blur-sm h-12 flex items-center border-b border-gray-800/50 drag-region">
      <div className="w-full flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900/50 rounded-lg flex items-center justify-center border border-gray-700/50">
            <img 
              src="./logo-gray.png" 
              alt="Logo" 
              className="w-5 h-5 object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-gray-200">AI Agent</span>
        </div>
        <div className="flex gap-1.5 no-drag-region">
          <button 
            onClick={onCollapse} 
            className="w-7 h-7 border-none bg-transparent text-gray-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gray-800/50 hover:text-gray-200 rounded-md no-drag-region"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 6L10 6" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
          <button 
            onClick={handleFullscreen} 
            className="w-7 h-7 border-none bg-transparent text-gray-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gray-800/50 hover:text-gray-200 rounded-md no-drag-region"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1H9V9H1V1Z" stroke="currentColor" strokeWidth="1"/>
              <path d="M3 3H7V7H3V3Z" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
          <button 
            onClick={handleClose} 
            className="w-7 h-7 border-none bg-transparent text-red-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-red-600/50 hover:text-white rounded-md no-drag-region"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 3L9 9M3 9L9 3" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleBar; 