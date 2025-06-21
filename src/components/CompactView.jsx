import React from 'react';

function CompactView({ onExpand }) {
  // Note: Drag functionality will be handled by the main process
  // This component just triggers the expand
  return (
    <div 
      className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center cursor-pointer shadow-lg border border-slate-600/50 transition-all duration-300 text-white hover:scale-105 hover:shadow-xl hover:border-slate-500/50 active:scale-95"
      onClick={onExpand}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
  );
}

export default CompactView; 