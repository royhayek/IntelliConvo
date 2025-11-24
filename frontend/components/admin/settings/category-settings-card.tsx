"use client";

import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingInput } from "./setting-input";
import { SETTING_CONFIG, CATEGORY_ICONS, CATEGORY_NAMES } from "@/lib/constants/settings-config";
import type { AdminSystemSetting } from "@/lib/api/generated/models/adminSystemSetting";

interface CategorySettingsCardProps {
  category: string;
  settings: AdminSystemSetting[];
  localSettings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
}

export function CategorySettingsCard({
  category,
  settings,
  localSettings,
  onSettingChange,
}: CategorySettingsCardProps) {
  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];

  if (settings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {CATEGORY_NAMES[category] || category} Settings
          </CardTitle>
          <CardDescription>
            Configure {(CATEGORY_NAMES[category] || category).toLowerCase()} settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No settings available for this category.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {CATEGORY_NAMES[category] || category} Settings
        </CardTitle>
        <CardDescription>
          Configure {(CATEGORY_NAMES[category] || category).toLowerCase()} settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings.map((setting) => {
            const value = localSettings[setting.key] ?? setting.value;
            const isSwitch = setting.type === 'BOOLEAN' || SETTING_CONFIG[setting.key]?.inputType === 'switch';

            return (
              <div key={setting.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  {isSwitch && (
                    <SettingInput
                      setting={setting}
                      value={value}
                      onChange={onSettingChange}
                    />
                  )}
                </div>
                {setting.description && (
                  <p className="text-sm text-gray-500">{setting.description}</p>
                )}
                {!isSwitch && (
                  <SettingInput
                    setting={setting}
                    value={value}
                    onChange={onSettingChange}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
