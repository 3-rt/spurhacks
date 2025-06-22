import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Eye, Minimize2, Maximize2, X, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";

function BrowserWindow({ url = "https://ui.shadcn.com/charts" }) {
  return (
    <Card className="h-full border border-gray-800 bg-gray-900/20 backdrop-blur-sm overflow-hidden">
      {/* Browser Header */}
      <div className="h-14 border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
          </div>
          <Separator orientation="vertical" className="h-5 bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono text-gray-300 max-w-2xl mx-auto">
            {url}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
            <Minimize2 className="w-4 h-4 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Browser Content - Placeholder for Stagehand Agent */}
      <CardContent className="h-full bg-black flex items-center justify-center p-12">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="w-24 h-24 mx-auto bg-gray-900/50 rounded-2xl flex items-center justify-center border border-gray-800">
            <Eye className="w-12 h-12 text-gray-500" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-mono text-gray-200">Stagehand Agent Browser</h3>
            <p className="text-lg text-gray-400 font-mono leading-relaxed">
              This area will display the Stagehand agent browser window for web automation and interaction
            </p>
          </div>
          <div className="border border-gray-800 bg-gray-950/50 p-6 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-gray-500 font-mono">
              <span className="text-gray-300 font-semibold">Integration Point:</span> Replace this placeholder with your Stagehand
              browser component for full web automation capabilities
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BrowserWindow; 