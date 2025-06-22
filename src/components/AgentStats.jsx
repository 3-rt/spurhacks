import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Settings } from "lucide-react";

function AgentStats() {
  return (
    <Card className="border-0 bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-mono text-gray-300">
          <Settings className="w-5 h-5 text-gray-400" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        right bar
        {/* System Status
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Stagehand Agent</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-green-500">●</div>
              <div className="text-xs text-gray-500 font-mono">Online</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-blue-500">●</div>
              <div className="text-xs text-gray-500 font-mono">Ready</div>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Features */}
        {/* <div className="space-y-4">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-green-400">Session Persistence</span>
              <span className="font-bold font-mono text-gray-200">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-green-400">Voice Input</span>
              <span className="font-bold font-mono text-gray-200">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-green-400">Memory System</span>
              <span className="font-bold font-mono text-gray-200">✓</span>
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
}

export default AgentStats; 