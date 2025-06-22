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
        console.log("BrowserWindow: Received event:", data);
        
        if (data.type === "stagehand-output" && data.data.type === "debug_url") {
          console.log("BrowserWindow: Found debug_url event:", data.data.content);
          const url = data.data.content.replace('Debug URL: ', '');
          console.log("BrowserWindow: Setting debug URL:", url);
          setDebugUrl(url);
        }
      };

      console.log("BrowserWindow: Setting up event listener");
      window.electronAPI.onStagehandStream(handleStream);
      
      return () => {
        console.log("BrowserWindow: Cleaning up event listener");
        window.electronAPI.removeAllListeners('stagehand-stream');
      };
    } else {
      console.log("BrowserWindow: electronAPI not available");
    }
  }, []);

  const openInNewWindow = () => {
    if (debugUrl) {
      window.open(debugUrl, '_blank');
    }
  };

  const refreshBrowser = () => {
    setIsLoading(true);
    // This is a mock refresh, in a real scenario you might reload the iframe
    setTimeout(() => {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.src = iframe.src;
      }
      setIsLoading(false)
    }, 1000);
  };

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full border border-gray-800 bg-black overflow-hidden flex flex-col rounded-xl">
        {/* Browser Content */}
        <CardContent className="flex-grow bg-black p-0">
          {debugUrl ? (
            <iframe 
              src={debugUrl} 
              className="w-full h-full border-0"
              title="BrowserBase Debug Interface"
            />
          ) : (
            <div className="h-full bg-black flex items-center justify-center">
              <div className="text-center space-y-2">
                <Eye className="w-8 h-8 mx-auto text-gray-600" />
                <h3 className="text-sm font-mono text-gray-300">Stagehand Agent Browser</h3>
                <p className="text-xs text-gray-500 font-mono max-w-[250px]">
                  BrowserBase debug interface will appear here when a session starts
                </p>
                <div className="border border-gray-700 bg-gray-900/30 p-2 rounded">
                  <p className="text-xs text-gray-600 font-mono">
                    <span className="text-gray-400">Status:</span> Waiting for BrowserBase session...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BrowserWindow; 