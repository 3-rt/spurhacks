import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { AlertTriangle, Shield, Target, Search, MoreHorizontal, Zap, Brain } from "lucide-react";

const thoughts = [
  { 
    type: 'Analyzing UI Overhaul', 
    details: 'I\'m currently focused on the shift from a "spy dashboard" to an AI assistant UI. My initial thought process involves simplifying the current interface. I\'m prioritizing user experience by streamlining data presentation.',
    timestamp: "2 minutes ago",
    duration: "11 seconds"
  },
  { 
    type: 'Conceiving the Transformation', 
    details: 'I\'ve outlined the major changes in main.js needed to implement the requested UI transition. My focus is now on the "click-and-expand" interaction.',
    timestamp: "5 minutes ago",
    duration: "7 seconds"
  },
  { 
    type: 'Refining Implementation Strategy', 
    details: 'Now I\'m diving deeper into the technical aspects. It appears that the request requires significant restructuring of both main.js and the front-end components.',
    timestamp: "8 minutes ago",
    duration: "15 seconds"
  }
];

function ActivityFeed() {
  return (
    <div className="flex h-full flex-col">
      {/* Activity Header */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono text-gray-300">Agent Thought Process</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-800">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search thoughts..."
              className="pl-9 h-8 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-500 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent Thoughts */}
      <Card className="flex-1 border-0 bg-transparent min-h-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="px-6 space-y-4">
              {thoughts.map((thought, index) => (
                <div key={index} className="border border-gray-700 bg-gray-900/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">{thought.timestamp}</span>
                        {thought.duration && (
                          <span className="text-xs text-gray-400 font-mono border border-gray-600 px-2 py-0.5 rounded">
                            {thought.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-green-400 font-mono">{thought.type}</h3>
                      <p className="text-sm leading-relaxed text-gray-300 font-mono">{thought.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardContent className="p-6 space-y-4">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-mono">
            <Zap className="w-4 h-4 mr-2" />
            Add Thought
          </Button>
          <Separator className="bg-gray-700" />
          <div className="text-center space-y-2">
            <div className="text-xs text-gray-500 font-mono">Press Ctrl+Shift+I to activate Windows</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 font-mono">Agent Status:</span>
              <span className="text-xs text-green-400 font-mono border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivityFeed; 