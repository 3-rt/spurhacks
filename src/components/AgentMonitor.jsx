import React from 'react';

function AgentMonitor() {
  return (
    <div className="h-full bg-gray-900 text-white p-4 flex flex-col">
      <div className="bg-gray-800 rounded-t-lg p-2 flex items-center">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="bg-gray-700 rounded-md px-4 py-1 flex-grow text-center">
          <p className="text-sm">localhost:3000</p>
        </div>
      </div>
      <div className="flex-grow bg-white text-black p-4 rounded-b-lg">
        <h1 className="text-2xl font-bold">Beautiful Charts & Graphs</h1>
        <p>A collection of ready-to-use chart components built with Recharts.</p>
        {/* Placeholder for the chart */}
        <div className="mt-4 border border-gray-300 rounded-lg p-4 h-64">
          Chart will be here
        </div>
      </div>
    </div>
  );
}

export default AgentMonitor; 