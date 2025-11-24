"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SETTING_CONFIG } from "@/lib/constants/settings-config";
import type { AdminSystemSetting } from "@/lib/api/generated/models/adminSystemSetting";

interface SettingInputProps {
  setting: AdminSystemSetting;
  value: string;
  onChange: (key: string, value: string) => void;
}

export function SettingInput({ setting, value, onChange }: SettingInputProps) {
  const config = SETTING_CONFIG[setting.key];

  if (setting.type === 'BOOLEAN' || config?.inputType === 'switch') {
    return (
      <Switch
        checked={value === 'true'}
        onCheckedChange={(checked) => onChange(setting.key, checked ? 'true' : 'false')}
      />
    );
  }

  if (config?.inputType === 'select' && config.options) {
    return (
      <Select value={value} onValueChange={(val) => onChange(setting.key, val)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {config.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (setting.type === 'NUMBER' || config?.inputType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(setting.key, e.target.value)}
        min={config?.min}
        max={config?.max}
        step={config?.step}
        className="w-full"
      />
    );
  }

  return (
    <Input
      type={setting.isSecret ? 'password' : 'text'}
      value={value}
      onChange={(e) => onChange(setting.key, e.target.value)}
      className="w-full"
      disabled={setting.isSecret}
    />
  );
}
