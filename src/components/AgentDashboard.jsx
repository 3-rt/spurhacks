import React, { useState, useEffect } from 'react';
import AgentStats from './AgentStats';
import OperationsList from './OperationsList';
import BrowserWindow from './BrowserWindow';
import AgentCOTStream from './AgentCOTStream';

function AgentDashboard() {
  const [selectedAgent] = useState("agent 01");
  const [browserUrl] = useState("https://ui.shadcn.com/charts");
  const [debugUrl, setDebugUrl] = useState(null);

  useEffect(() => {
    // Listen for BrowserBase debug URL from stagehand output
    if (window.electronAPI) {
      const handleStream = (data) => {
        if (data.type === "stagehand-output" && data.data.type === "debug_url") {
          setDebugUrl(data.data.content.replace('Debug URL: ', ''));
        }
      };

      window.electronAPI.onStagehandStream(handleStream);
      
      return () => {
        window.electronAPI.removeAllListeners('stagehand-stream');
      };
    }
  }, []);

  return (
    <div className="flex h-full w-full bg-black text-gray-300 overflow-hidden">
      {/* Left Sidebar - Responsive width */}
      <div className="w-80 min-w-64 max-w-96 border-r border-gray-800 bg-gray-950/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="p-6 flex-shrink-0">
            <AgentStats />
          </div>
          <div className="flex-1 overflow-hidden">
            <OperationsList />
          </div>
        </div>
      </div>

      {/* Main Content Area - Flexible width */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 bg-gray-950/30 backdrop-blur-sm flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-2xl font-bold font-mono text-gray-100">Agent Monitor</h1>
          <div className="text-sm text-gray-400 flex items-center gap-3 font-mono">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Currently Viewing — {selectedAgent}
            {debugUrl && (
              <span className="text-blue-400"> • BrowserBase Active</span>
            )}
          </div>
        </div>

        {/* Browser Window */}
        <div className="flex-1 p-2 flex items-center justify-center overflow-hidden">
          <BrowserWindow url={debugUrl || browserUrl} />
        </div>
      </div>

      {/* Right Sidebar - Responsive width, always flush to right */}
      <div className="w-96 min-w-80 max-w-[30%] border-l border-gray-800 bg-gray-950/30 backdrop-blur-sm flex-shrink-0">
        <div className="h-full w-full overflow-hidden">
          <AgentCOTStream />
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard; 