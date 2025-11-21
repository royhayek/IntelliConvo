"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function ToggleField({
  label,
  checked,
  onChange,
  description
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function FormToggleField<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  control
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  control: Control<TFieldValues>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <ToggleField
          label={label}
          checked={field.value as boolean}
          onChange={field.onChange}
          description={description}
        />
      )}
    />
  );
}
