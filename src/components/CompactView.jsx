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
        <img 
          src="./logo-gray.png" 
          alt="Logo" 
          className="w-8 h-8 object-contain"
        />
      </div>
    </div>
  );
}

export default CompactView; 