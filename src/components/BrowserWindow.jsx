import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Eye, Minimize2, Maximize2, X, RefreshCw, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

function BrowserWindow({ url = "https://ui.shadcn.com/charts" }) {
  const [debugUrl, setDebugUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for BrowserBase debug URL from stagehand output
    if (window.electronAPI) {
      const handleStream = (data) => {
        if (data.type === "stagehand-output" && data.data.type === "debug_url") {
          setDebugUrl(data.data.content.replace('Debug URL: ', ''));
        }
      };

      window.electronAPI.onStagehandStream(handleStream);
      
      return () => {
        window.electronAPI.removeAllListeners('stagehand-stream');
      };
    }
  }, []);

  const openInNewWindow = () => {
    if (debugUrl) {
      window.open(debugUrl, '_blank');
    }
  };

  const refreshBrowser = () => {
    setIsLoading(true);
    // Add a small delay to show loading state
    setTimeout(() => setIsLoading(false), 1000);
  };

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
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-gray-700"
              onClick={refreshBrowser}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex-1 mx-6">
          <div className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm font-mono text-gray-300">
            {debugUrl || url}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {debugUrl && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 hover:bg-gray-700"
              onClick={openInNewWindow}
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-700">
            <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-800/50">
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Browser Content */}
      <CardContent className="h-full bg-black p-0">
        {debugUrl ? (
          // Display BrowserBase debug interface
          <iframe 
            src={debugUrl} 
            className="w-full h-full border-0"
            title="BrowserBase Debug Interface"
          />
        ) : (
          // Placeholder when no debug URL is available
          <div className="h-full bg-black flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Eye className="w-16 h-16 mx-auto text-gray-600" />
              <h3 className="text-lg font-mono text-gray-300">Stagehand Agent Browser</h3>
              <p className="text-sm text-gray-500 font-mono max-w-md">
                BrowserBase debug interface will appear here when a session starts
              </p>
              <div className="border border-gray-700 bg-gray-900/30 p-4 rounded">
                <p className="text-xs text-gray-600 font-mono">
                  <span className="text-gray-400">Status:</span> Waiting for BrowserBase session...
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BrowserWindow; 