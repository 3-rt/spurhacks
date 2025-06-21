"use client"

import { useState } from "react"
import { AgentStats } from "./agent-stats"
import { OperationsList } from "./operations-list"
import { BrowserWindow } from "./browser-window"
import { ActivityFeed } from "./activity-feed"
import { Activity, AlertTriangle, CheckCircle, XCircle, Zap, Shield, Target } from "lucide-react"

interface Mission {
  id: string
  code: string
  title: string
  location: string
  risk: "HIGH" | "MEDIUM" | "LOW"
  status: "active" | "completed" | "failed"
}

interface ActivityLog {
  id: string
  timestamp: string
  type: "thought" | "action" | "status"
  content: string
  duration?: string
}

const missions: Mission[] = [
  {
    id: "1",
    code: "Omega",
    title: "Track high-value target in Eastern Europe",
    location: "Eastern Europe",
    risk: "HIGH",
    status: "active",
  },
  {
    id: "2",
    code: "nDva",
    title: "Infiltrate cybercrime network in Seoul",
    location: "Seoul",
    risk: "MEDIUM",
    status: "active",
  },
  {
    id: "3",
    code: "Silentfire",
    title: "Intercept illegal arms trade in Libya",
    location: "Libya",
    risk: "HIGH",
    status: "completed",
  },
  {
    id: "4",
    code: "Echo",
    title: "Monitor cryptocurrency exchanges",
    location: "Global",
    risk: "LOW",
    status: "failed",
  },
]

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
      'Analyzing UI Overhaul - I\'m currently focused on the shift from a "spy dashboard" to an AI assistant interface. My initial thoughts involve simplifying the current interface.',
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

export default function AgentDashboard() {
  const [selectedAgent] = useState("agent 01")
  const [browserUrl] = useState("https://ui.shadcn.com/charts")

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Zap className="w-4 h-4 text-emerald-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "thought":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "action":
        return <Target className="w-4 h-4 text-blue-500" />
      case "status":
        return <Shield className="w-4 h-4 text-emerald-500" />
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex h-screen bg-black text-gray-300">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-950/50">
        <div className="flex h-full flex-col p-4 space-y-4">
          <AgentStats />
          <OperationsList />
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
          <BrowserWindow />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-800 bg-gray-950/50">
        <div className="h-full p-4">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
