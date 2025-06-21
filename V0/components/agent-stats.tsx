"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Settings } from "lucide-react"

export function AgentStats() {
  return (
    <Card className="border-0 bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-mono text-gray-300">
          <Settings className="w-5 h-5 text-gray-400" />
          Agent Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Activity Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Agent Activity</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-gray-200">72</div>
              <div className="text-xs text-gray-500 font-mono">Total</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-green-500">45</div>
              <div className="text-xs text-gray-500 font-mono">Success</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-red-500">27</div>
              <div className="text-xs text-gray-500 font-mono">Failed</div>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Risk Levels */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">Risk Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-red-400">HIGH RISK</span>
              <span className="font-bold font-mono text-gray-200">30</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-yellow-400">MEDIUM RISK</span>
              <span className="font-bold font-mono text-gray-200">34</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-green-400">LOW RISK</span>
              <span className="font-bold font-mono text-gray-200">08</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
