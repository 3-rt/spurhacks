import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Eye, Minimize2, Maximize2, X, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";

function BrowserWindow({ url = "https://ui.shadcn.com/charts" }) {
  return (
    <Card className="h-full border border-gray-700 bg-gray-900/50 overflow-hidden">
      {/* Browser Header */}
      <div className="h-12 border-b border-gray-700 bg-gray-800/80 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <Separator orientation="vertical" className="h-4 bg-gray-600" />
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
              <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="flex-1 mx-6">
          <div className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm font-mono text-gray-300">
            {url}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
            <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
            <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Browser Content - Placeholder for Stagehand Agent */}
      <CardContent className="h-full bg-black flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Eye className="w-16 h-16 mx-auto text-gray-600" />
          <h3 className="text-lg font-mono text-gray-300">Stagehand Agent Browser</h3>
          <p className="text-sm text-gray-500 font-mono max-w-md">
            This area will display the Stagehand agent browser window
          </p>
          <div className="border border-gray-700 bg-gray-900/30 p-4 rounded">
            <p className="text-xs text-gray-600 font-mono">
              <span className="text-gray-400">Integration Point:</span> Replace this placeholder with your Stagehand
              browser component
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BrowserWindow; 