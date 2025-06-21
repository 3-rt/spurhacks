import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Settings, MoreHorizontal, Info, Activity, Users, Database } from "lucide-react";

function ShadcnExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              shadcn/ui Components Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Badges */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Badges</h3>
              <div className="flex gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            {/* Buttons with Tooltips */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Buttons with Tooltips</h3>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default">
                      <Info className="w-4 h-4 mr-2" />
                      Info
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is an info button</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">
                      <Activity className="w-4 h-4 mr-2" />
                      Activity
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View activity logs</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dropdown Menu</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Users className="w-4 h-4 mr-2" />
                    View Users
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Database className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tabs */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Tabs</h3>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        This is the overview tab content.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="analytics" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Analytics data would go here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="reports" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        Reports and exports would be here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Dialog */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dialog</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agent Configuration</DialogTitle>
                    <DialogDescription>
                      Configure your agent settings and preferences here.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This is an example of how to use the Dialog component for modals and popups.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsDialogOpen(false)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default ShadcnExample; 