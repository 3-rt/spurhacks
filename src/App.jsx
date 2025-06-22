import React, { useState } from 'react';
import AgentDashboard from './components/AgentDashboard';
import CompactView from './components/CompactView';
import TitleBar from './components/TitleBar';



function App() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    window.electronAPI.expandWindow().then(() => {
      setIsExpanded(true);
    });
  };

  const handleCollapse = () => {
    window.electronAPI.collapseWindow().then(() => {
      setIsExpanded(false);
    });
  };

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <CompactView onExpand={handleExpand} />
      </div>
    );
  }

  return (
    <div className="bg-black text-white h-screen flex flex-col overflow-hidden">
      <TitleBar onCollapse={handleCollapse} />
      <div className="flex flex-1 overflow-hidden">
        <AgentDashboard />
      </div>
    </div>
  );
}

export default App; 