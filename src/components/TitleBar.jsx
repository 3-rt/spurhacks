import React from 'react';

function TitleBar({ onCollapse }) {
  return (
    <div className="bg-slate-900/90 h-10 flex items-center webkit-app-region-drag border-b border-slate-800/50">
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
          <button onClick={onCollapse} className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 6L10 6" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleBar; 