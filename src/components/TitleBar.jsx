import React from 'react';
import { Minus, Square, X } from 'lucide-react';

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
          <span className="text-sm font-semibold text-gray-200">Hermes</span>
        </div>
        <div className="flex gap-1.5 no-drag-region">
          <button 
            onClick={onCollapse} 
            className="w-7 h-7 border-none bg-transparent text-gray-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gray-800/50 hover:text-gray-200 rounded-md no-drag-region"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={handleFullscreen} 
            className="w-7 h-7 border-none bg-transparent text-gray-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gray-800/50 hover:text-gray-200 rounded-md no-drag-region"
          >
            <Square size={12} />
          </button>
          <button 
            onClick={handleClose} 
            className="w-7 h-7 border-none bg-transparent text-red-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-red-600/50 hover:text-white rounded-md no-drag-region"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleBar; 