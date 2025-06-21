import React, { useState } from 'react';
import AgentStats from './AgentStats';
import OperationsList from './OperationsList';
import BrowserWindow from './BrowserWindow';
import ActivityFeed from './ActivityFeed';

function AgentDashboard() {
  const [selectedAgent] = useState("agent 01");
  const [browserUrl] = useState("https://ui.shadcn.com/charts");

  return (
    <div className="flex h-full bg-black text-gray-300">
      {/* Left Sidebar */}
      <div className="w-96 border-r border-gray-800 bg-gray-950/50">
        <div className="flex h-full flex-col">
          <div className="p-4">
            <AgentStats />
          </div>
          <div className="flex-1 flex">
            <OperationsList />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold font-mono text-gray-200">Agent Monitor</h1>
          <div className="text-sm text-gray-400 flex items-center gap-2 font-mono">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Currently Viewing — {selectedAgent}
          </div>
        </div>

        {/* Browser Window */}
        <div className="flex-1 p-6">
          <BrowserWindow url={browserUrl} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-800 bg-gray-950/50">
        <div className="h-full p-4">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard; 