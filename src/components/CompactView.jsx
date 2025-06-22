import React from 'react';

function CompactView({ onExpand }) {
  // Note: Drag functionality will be handled by the main process
  // This component just triggers the expand
  return (
    <div 
      className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl border border-gray-700/50 transition-all duration-300 text-white hover:scale-110 hover:shadow-3xl hover:border-gray-600/50 active:scale-95 backdrop-blur-sm drag-region"
      onClick={onExpand}
    >
      <div 
        className="w-12 h-12 bg-gray-900/50 rounded-xl flex items-center justify-center border border-gray-700/50 no-drag-region"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
    </div>
  );
}

export default CompactView; 