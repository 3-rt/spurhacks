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
      <div className="flex items-center justify-center min-h-screen">
        <CompactView onExpand={handleExpand} />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col" style={{ height: '100vh' }}>
      <TitleBar onCollapse={handleCollapse} />
      <div className="flex flex-grow">
        <AgentDashboard />
      </div>
    </div>
  );
}

export default App; 