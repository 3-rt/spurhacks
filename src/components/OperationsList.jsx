import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const missions = [
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
    code: "n0va",
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
    code: "Omega",
    title: "Track high-value target in Eastern Europe",
    location: "Eastern Europe",
    risk: "LOW",
    status: "failed",
  },
];

function OperationsList() {
  return (
    <Card className="flex-1 border-0 bg-transparent">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <h3 className="text-lg font-mono text-gray-300">
            Operations List <span className="text-red-500">(20)</span>
          </h3>
          <p className="text-sm text-gray-500 font-mono">4 updates in the previous 24 hours</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 px-6">
            {missions.map((mission) => (
              <div key={mission.id} className="border border-gray-700 bg-gray-900/30 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 font-mono">
                    Mission Code: <span className="text-gray-300">{mission.code}</span>
                  </div>
                  <h4 className="text-gray-200 font-mono leading-relaxed">{mission.title}</h4>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 font-mono"
                  >
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 font-mono"
                  >
                    Join Mission »
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default OperationsList; 