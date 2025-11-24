"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WidgetSettings {
  primaryColor: string;
  launcherPosition: string;
}

interface WidgetSettingsCardProps {
  settings: WidgetSettings | null;
}

export function WidgetSettingsCard({ settings }: WidgetSettingsCardProps) {
  if (!settings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Widget Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Primary Color</label>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: settings.primaryColor }}
              />
              <span className="font-mono text-sm">{settings.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Position</label>
            <p className="mt-1">
              <Badge variant="outline">{settings.launcherPosition}</Badge>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
