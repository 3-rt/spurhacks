import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { AlertTriangle, Shield, Target, Search, MoreHorizontal, Zap, Brain, Globe, Play, Square, RotateCcw } from "lucide-react";
import stagehandService from '../services/stagehandService';

const AgentActivityFeed = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [agentActivities, setAgentActivities] = useState([
    {
      type: 'Agent Ready',
      details: 'Stagehand browser agent is ready to execute tasks. Enter a query to begin automation.',
      timestamp: "Just now",
      status: 'ready',
      icon: Globe
    }
  ]);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    // Initialize the Stagehand service when component mounts
    stagehandService.initialize().catch(console.error);
  }, []);

  const handleRunAgent = async () => {
    if (!userQuery.trim()) return;
    
    setIsRunning(true);
    setCurrentTask(userQuery);
    
    // Add starting activity
    const newActivity = {
      type: 'Starting Task',
      details: `Executing: "${userQuery}"`,
      timestamp: "Just now",
      status: 'running',
      icon: Play
    };
    
    setAgentActivities(prev => [newActivity, ...prev]);
    
    try {
      // Execute the task using the Stagehand service
      const result = await stagehandService.executeTask(userQuery);
      
      // Add completion activity
      const completionActivity = {
        type: 'Task Complete',
        details: result.result,
        timestamp: "Just now",
        status: 'success',
        icon: Shield
      };
      
      setAgentActivities(prev => [completionActivity, ...prev]);
      
    } catch (error) {
      console.error('Agent execution error:', error);
      const errorActivity = {
        type: 'Task Failed',
        details: `Error: ${error.message}`,
        timestamp: "Just now",
        status: 'error',
        icon: AlertTriangle
      };
      setAgentActivities(prev => [errorActivity, ...prev]);
    } finally {
      setIsRunning(false);
      setCurrentTask('');
    }
  };

  const handleStopAgent = () => {
    stagehandService.stopCurrentTask();
    setIsRunning(false);
    setCurrentTask('');
    const stopActivity = {
      type: 'Task Stopped',
      details: 'Agent execution was manually stopped',
      timestamp: "Just now",
      status: 'stopped',
      icon: Square
    };
    setAgentActivities(prev => [stopActivity, ...prev]);
  };

  const handleReset = () => {
    stagehandService.reset();
    setAgentActivities([{
      type: 'Agent Reset',
      details: 'Agent has been reset and is ready for new tasks',
      timestamp: "Just now",
      status: 'ready',
      icon: RotateCcw
    }]);
    setUserQuery('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-blue-400';
      case 'running': return 'text-green-400';
      case 'thinking': return 'text-yellow-400';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-400';
      case 'stopped': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'ready': return 'bg-blue-500/10 border-blue-500/30';
      case 'running': return 'bg-green-500/10 border-green-500/30';
      case 'thinking': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success': return 'bg-green-500/10 border-green-500/30';
      case 'error': return 'bg-red-500/10 border-red-500/30';
      case 'stopped': return 'bg-gray-500/10 border-gray-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Agent Header */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono text-gray-300">Stagehand Agent</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-800">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isRunning ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <span>{isRunning ? 'Executing Task' : 'Ready'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              placeholder="Enter task for browser automation..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="h-8 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-500 font-mono"
              disabled={isRunning}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isRunning && userQuery.trim()) {
                  handleRunAgent();
                }
              }}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleRunAgent}
                disabled={isRunning || !userQuery.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 border border-green-500 text-white font-mono text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                {isRunning ? 'Running...' : 'Execute'}
              </Button>
              {isRunning && (
                <Button 
                  onClick={handleStopAgent}
                  className="bg-red-600 hover:bg-red-700 border border-red-500 text-white font-mono text-xs"
                >
                  <Square className="w-3 h-3" />
                </Button>
              )}
              <Button 
                onClick={handleReset}
                variant="ghost"
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-mono text-xs"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Activities */}
      <Card className="flex-1 border-0 bg-transparent min-h-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="px-6 space-y-4">
              {agentActivities.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="border border-gray-700 bg-gray-900/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <IconComponent className={`w-4 h-4 ${getStatusColor(activity.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">{activity.timestamp}</span>
                          <span className={`text-xs font-mono border px-2 py-0.5 rounded ${getStatusBg(activity.status)} ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                        <h3 className={`font-bold font-mono ${getStatusColor(activity.status)}`}>{activity.type}</h3>
                        <p className="text-sm leading-relaxed text-gray-300 font-mono">{activity.details}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-xs text-gray-500 font-mono">Press Ctrl+Shift+I to activate Windows</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 font-mono">Agent Status:</span>
              <span className={`text-xs font-mono border px-2 py-0.5 rounded ${getStatusBg(isRunning ? 'running' : 'ready')} ${getStatusColor(isRunning ? 'running' : 'ready')}`}>
                {isRunning ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
          <Separator className="bg-gray-700" />
          <div className="text-xs text-gray-500 font-mono text-center">
            Powered by Stagehand Browser Automation
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentActivityFeed; 