"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Shield, Target, Search, MoreHorizontal, Zap } from "lucide-react"

interface ActivityLog {
  id: string
  timestamp: string
  type: "thought" | "action" | "status"
  content: string
  duration?: string
}

const activityLogs: ActivityLog[] = [
  {
    id: "1",
    timestamp: "2 minutes ago",
    type: "status",
    content: "Getting started with Electron basics",
  },
  {
    id: "2",
    timestamp: "5 minutes ago",
    type: "thought",
    content:
      'Analyzing UI Overhaul - I\'m currently focused on the shift from a "spy dashboard" to an AI assistant interface.',
    duration: "11 seconds",
  },
  {
    id: "3",
    timestamp: "8 minutes ago",
    type: "action",
    content:
      "Connecting the Transformation - I've outlined the major changes to main.js needed to implement the expanded UI functionality.",
  },
  {
    id: "4",
    timestamp: "12 minutes ago",
    type: "thought",
    content: "Refining Implementation Strategy - Now I'm diving deeper into the technical aspects.",
    duration: "7 seconds",
  },
]

export function ActivityFeed() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "thought":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "action":
        return <Target className="w-4 h-4 text-blue-500" />
      case "status":
        return <Shield className="w-4 h-4 text-green-500" />
      default:
        return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Activity Header */}
      <Card className="border-0 bg-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono text-gray-300">Activity Feed</CardTitle>
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
              placeholder="Search activity..."
              className="pl-9 h-8 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-500 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="flex-1 border-0 bg-transparent">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="px-6 space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="border border-gray-700 bg-gray-900/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(log.type)}</div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">{log.timestamp}</span>
                        {log.duration && (
                          <span className="text-xs text-gray-400 font-mono border border-gray-600 px-2 py-0.5 rounded">
                            {log.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-300 font-mono">{log.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <Card className="border-0 bg-transparent">
        <CardContent className="p-6 space-y-4">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-mono">
            <Zap className="w-4 h-4 mr-2" />
            Add Contact
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
