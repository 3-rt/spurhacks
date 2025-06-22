import React, { useState, useEffect } from 'react';
import BrowserWindow from './BrowserWindow';
import AgentCOTStream from './AgentCOTStream';

function AgentDashboard() {
  const [selectedAgent] = useState("agent 01");
  const [browserUrl] = useState("https://ui.shadcn.com/charts");
  const [debugUrl, setDebugUrl] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    stagehand: 'ready',
    browserbase: 'ready',
    groq: 'ready',
    memory: 'ready'
  });
  const [agentState, setAgentState] = useState('idle'); // idle, thinking, working, success, error

  useEffect(() => {
    // Listen for BrowserBase debug URL from stagehand output
    if (window.electronAPI) {
      const handleStream = (data) => {
        console.log("AgentDashboard: Received event:", data);
        
        if (data.type === "stagehand-output" && data.data.type === "debug_url") {
          console.log("AgentDashboard: Found debug_url event:", data.data.content);
          const url = data.data.content.replace('Debug URL: ', '');
          console.log("AgentDashboard: Setting debug URL:", url);
          setDebugUrl(url);
          setSystemStatus(prev => ({ ...prev, browserbase: 'connected' }));
          
          // Gradually connect other systems with random delays
          setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, stagehand: 'connected' }));
          }, Math.random() * 1000);
          
          setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, groq: 'connected' }));
          }, Math.random() * 1000);
          
          setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, memory: 'connected' }));
          }, Math.random() * 1000);
        }
        
        // Update agent state based on events
        if (data.type === "output" && data.data) {
          const output = data.data.toLowerCase();
          // Detect different stages from Stagehand output
          if (output.includes('analyzing') || output.includes('thinking') || output.includes('understanding') || output.includes('processing')) {
            setAgentState('thinking');
          } else if (output.includes('executing') || output.includes('clicking') || output.includes('typing') || output.includes('navigating') || output.includes('action') || output.includes('performing')) {
            setAgentState('working');
          } else if (output.includes('completed') || output.includes('success') || output.includes('done') || output.includes('finished')) {
            setAgentState('success');
            setTimeout(() => setAgentState('idle'), 2000);
          } else if (output.includes('error') || output.includes('failed') || output.includes('unable') || output.includes('timeout')) {
            setAgentState('error');
            setTimeout(() => setAgentState('idle'), 3000);
          }
        }
        
        // Handle completion events
        if (data.type === "complete") {
          if (data.success) {
            setAgentState('success');
            setTimeout(() => setAgentState('idle'), 2000);
          } else {
            setAgentState('error');
            setTimeout(() => setAgentState('idle'), 3000);
          }
        }
      };

      // Also listen for when tasks are initiated
      const handleTaskStart = () => {
        setAgentState('thinking');
      };

      console.log("AgentDashboard: Setting up event listener");
      window.electronAPI.onStagehandStream(handleStream);
      
      // Listen for task start events
      const handleTaskInitiation = () => {
        setAgentState('thinking');
      };
      
      // Add event listener for task starts (can be triggered by voice or text input)
      window.addEventListener('stagehand-task-start', handleTaskInitiation);
      
      return () => {
        console.log("AgentDashboard: Cleaning up event listener");
        window.electronAPI.removeAllListeners('stagehand-stream');
        window.removeEventListener('stagehand-task-start', handleTaskInitiation);
      };
    } else {
      console.log("AgentDashboard: electronAPI not available");
    }
  }, []);



  // Visual components
  const PulsingDot = ({ status, size = 'w-3 h-3' }) => {
    const getStatusStyles = () => {
      switch(status) {
        case 'connected':
          return 'bg-green-500 connectivity-pulse glow-green';
        case 'ready':
          return 'bg-blue-500 connectivity-pulse glow-blue';
        case 'testing':
          return 'bg-yellow-500 connectivity-pulse glow-yellow';
        case 'error':
          return 'bg-red-500';
        case 'disconnected':
        default:
          return 'bg-gray-500 opacity-50';
      }
    };
    
    const extraStyles = status === 'error' ? {
      boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)'
    } : {};
    
    return (
      <div 
        className={`${size} rounded-full ${getStatusStyles()} shadow-lg relative`}
        style={extraStyles}
      ></div>
    );
  };

  const AgentStatusIndicator = ({ state }) => {
    const getStateConfig = () => {
      switch(state) {
        case 'thinking':
          return {
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20 glow-blue',
            icon: '🤔',
            animation: 'agent-thinking',
            text: 'Analyzing...',
            borderColor: 'border-blue-500/30'
          };
        case 'working':
          return {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20 glow-yellow',
            icon: '⚡',
            animation: 'agent-working',
            text: 'Executing...',
            borderColor: 'border-yellow-500/30'
          };
        case 'success':
          return {
            color: 'text-green-400',
            bgColor: 'bg-green-500/20 glow-green',
            icon: '✅',
            animation: '',
            text: 'Complete!',
            borderColor: 'border-green-500/30'
          };
        case 'error':
          return {
            color: 'text-red-400',
            bgColor: 'bg-red-500/20 glow-red',
            icon: '❌',
            animation: 'error-shake',
            text: 'Error',
            borderColor: 'border-red-500/30'
          };
        case 'idle':
        default:
          return {
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/10',
            icon: '😴',
            animation: '',
            text: 'Idle',
            borderColor: 'border-gray-700'
          };
      }
    };
    
    const config = getStateConfig();
    
    return (
      <div className={`flex items-center justify-center p-6 rounded-lg ${config.bgColor} border ${config.borderColor} transition-all duration-300`}>
        <div className="text-center space-y-4">
          <div className={`${config.animation}`} style={{ fontSize: '3.6rem' }}>
            {config.icon}
          </div>
          <div className={`text-lg font-mono ${config.color} font-semibold`}>
            {config.text}
          </div>
        </div>
      </div>
    );
  };

  const SystemConnectivity = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">System Connectivity</h3>
      <div className="space-y-3">
        {/* Hermes */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-4 h-4">
              <PulsingDot status={systemStatus.stagehand} />
            </div>
            <span className="text-sm font-mono text-gray-300">Hermes</span>
          </div>
          <span className="text-xs font-mono text-gray-500 capitalize" style={{ fontSize: '10px' }}>
            {systemStatus.stagehand}
          </span>
        </div>
        
        {/* Browser */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-4 h-4">
              <PulsingDot status={systemStatus.browserbase} />
            </div>
            <span className="text-sm font-mono text-gray-300">Browser</span>
          </div>
          <span className="text-xs font-mono text-gray-500 capitalize" style={{ fontSize: '10px' }}>
            {systemStatus.browserbase}
          </span>
        </div>
        
        {/* Voice */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-4 h-4">
              <PulsingDot status={systemStatus.groq} />
            </div>
            <span className="text-sm font-mono text-gray-300">Voice</span>
          </div>
          <span className="text-xs font-mono text-gray-500 capitalize" style={{ fontSize: '10px' }}>
            {systemStatus.groq}
          </span>
        </div>
        
        {/* Memory */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-4 h-4">
              <PulsingDot status={systemStatus.memory} />
            </div>
            <span className="text-sm font-mono text-gray-300">Memory</span>
          </div>
          <span className="text-xs font-mono text-gray-500 capitalize" style={{ fontSize: '10px' }}>
            {systemStatus.memory}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full bg-black text-gray-300 overflow-hidden">
      {/* Left Sidebar - Visual Status Panel */}
      <div className="w-64 min-w-52 max-w-80 border-r border-gray-800 bg-gray-950/30 backdrop-blur-sm flex-shrink-0">
        <div className="p-6 h-full overflow-y-auto space-y-6">
          {/* Agent Status Visualization */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Agent Status</h3>
            <AgentStatusIndicator state={agentState} />
          </div>
          
          {/* System Connectivity */}
          <SystemConnectivity />
          

        </div>
      </div>

      {/* Main Content Area - Flexible width */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 bg-gray-950/30 backdrop-blur-sm flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-2xl font-bold font-mono text-gray-100">Agent Monitor</h1>
          <div className="text-sm text-gray-400 flex items-center gap-3 font-mono">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="whitespace-nowrap">Currently Viewing — {selectedAgent}</span>
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