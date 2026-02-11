"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Save, RotateCcw, Settings } from "lucide-react";

export function Configurations() {
  const [config, setConfig] = useState({
    defaultRows: 6,
    defaultColumns: 5,
    maxCapacity: 30,
  });

  const handleSave = () => {
    // Save configuration logic
    console.log("Configuration saved:", config);
  };

  const handleReset = () => {
    setConfig({
      defaultRows: 6,
      defaultColumns: 5,
      maxCapacity: 30,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            System Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure default settings for the examination system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Matrix Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Room Matrix Settings
            </CardTitle>
            <CardDescription>
              Configure default room dimensions and capacity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultRows">Default Rows</Label>
                <Input
                  id="defaultRows"
                  type="number"
                  value={config.defaultRows}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      defaultRows: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultColumns">Default Columns</Label>
                <Input
                  id="defaultColumns"
                  type="number"
                  value={config.defaultColumns}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      defaultColumns: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Max Capacity per Room</Label>
              <Input
                id="maxCapacity"
                type="number"
                value={config.maxCapacity}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxCapacity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Default Matrix:{" "}
                <strong className="text-foreground">
                  {config.defaultRows} × {config.defaultColumns}
                </strong>{" "}
                = {config.defaultRows * config.defaultColumns} seats
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
